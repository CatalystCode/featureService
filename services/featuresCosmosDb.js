"use strict"

const async = require('async'),
      azure = require('azure-storage'),
      common = require('service-utils'),
      GeoPoint = require('geopoint'),
      HttpStatus = require('http-status-codes'),
      process = require('process'),
      escapeSql = require('./postgres').escapeSql,
      ServiceError = common.utils.ServiceError,
      turf = require('turf'),
      url = require('url');

const DocumentDBClient = require('documentdb').DocumentClient;

const FEATURES_DATABASE_NAME = "featuresdb";
const FEATURES_COLLECTION_NAME = "features";

let featuresDatabase;
let featuresCollection;

let featuresDbClient;

function getOrCreateDatabase(callback) {
    var querySpec = {
        query: 'SELECT * FROM root r WHERE r.id= @id',
        parameters: [{
            name: '@id',
            value: FEATURES_DATABASE_NAME
        }]
    };

    featuresDbClient.queryDatabases(querySpec).toArray(function (err, results) {
        if (err) {
            callback(err);

        } else {
            if (results.length === 0) {
                var databaseSpec = {
                    id: FEATURES_DATABASE_NAME
                };

                featuresDbClient.createDatabase(databaseSpec, callback);

            } else {
                callback(null, results[0]);
            }
        }
    });
}

/*
SELECT * FROM features WHERE ST_INTERSECTS(features.hull, {
        'type': 'Point',
        'coordinates':[
      -87.706279,
      41.87615
    ]
    })
*/

function getOrCreateCollection(callback) {
    var querySpec = {
        query: 'SELECT * FROM root r WHERE r.id=@id',
        parameters: [{
            name: '@id',
            value: FEATURES_COLLECTION_NAME
        }]
    };

    featuresDbClient.queryCollections(featuresDatabase._self, querySpec).toArray(function (err, results) {
        if (err) return callback(err);
        if (results.length > 0) return callback(null, results[0]);

        var collectionSpec = {
            id: FEATURES_COLLECTION_NAME
        };

        featuresDbClient.createCollection(featuresDatabase._self, collectionSpec, callback);
    });
}

function get(options, callback) {
    var querySpec = {
        query: 'SELECT TOP 50 * FROM logs l ORDER BY l._ts DESC'
    };

    featuresDbClient.queryDocuments(logCollection._self, querySpec).toArray(callback);
}

function init(callback) {
    console.log('init called');
    if (!process.env.FEATURES_COSMOSDB_AUTH_KEY) return callback(new Error("Required env variable LOGS_COSMOSDB_AUTH_KEY not set."));
    if (!process.env.FEATURES_COSMOSDB_HOST) return callback(new Error("Required env variable LOGS_COSMOSDB_HOST not set."));


    featuresDbClient = new DocumentDBClient(process.env.FEATURES_COSMOSDB_HOST, {
        masterKey: process.env.FEATURES_COSMOSDB_AUTH_KEY
    });

    getOrCreateDatabase((err, db) => {
        if (err) return callback(err);

        featuresDatabase = db;

        getOrCreateCollection((err, collection) => {
            if (err) return callback(err);

            featuresCollection = collection;

            return callback();
        });
    });
}

function getById(query, callback) {
    const ids = query.id.constructor === Array ? query.id : [query.id];
    const getQuery = `SELECT ${buildQueryColumns(query)} FROM features WHERE id IN (${ids.map(escapeSql).join(',')})`;
    executeQuery(getQuery, (err, rows) => {
        if (err) return callback(err);
        if (!rows || rows.length === 0) return callback(null, null);

        return callback(null, rows);
    });
}

function rowToFeature(row, columns) {
    if (!row) return;

    row['createdAt'] = row['created_at'];
    row['updatedAt'] = row['updated_at'];
    if (row['hull_geo_json']) row['hull'] = JSON.parse(row['hull_geo_json']);

    delete row['created_at'];
    delete row['updated_at'];
    delete row['hull_geo_json'];

    return row;
}

function resultsToFeatures(results) {
    let features = [];

    results.rows.forEach(function(row) {
        let feature = rowToFeature(row);
        features.push(feature);
    });

    return features;
}

const COLUMN_QUERY = 'id, name, layer';

function buildQueryColumns(query) {
    let queryColumns = COLUMN_QUERY;
    if (query.include) {
        let includeArray = query.include.split(',');

        if (includeArray.indexOf('hull') !== -1) queryColumns += ',ST_AsGeoJSON(hull) as hull_geo_json';
        if (includeArray.indexOf('properties') !== -1) queryColumns += ',properties';
    }

    return queryColumns;
}

function getByBoundingBox(query, callback) {
    let boundingBoxQuery = `SELECT * FROM features WHERE ST_Intersects(features.hull, {
        'type':'Polygon',
        'coordinates': [[
            [${query.west}, ${query.north}],
            [${query.east}, ${query.north}],
            [${query.east}, ${query.south}],
            [${query.west}, ${query.south}],
            [${query.west}, ${query.north}]
        ]]
    })`;

    if (query.layer) {
        boundingBoxQuery += ` AND layer=${escapeSql(query.layer)}`;
    }

    console.log(boundingBoxQuery);

    featuresDbClient.queryDocuments(featuresCollection._self, boundingBoxQuery).toArray(callback);
}

function getByPoint(query, callback) {
    let pointQuery = `SELECT * FROM features WHERE ST_INTERSECTS(features.hull, {
        'type': 'Point',
        'coordinates':[${query.latitude}, ${query.longitude}]
    })`;

    if (query.layer) {
        pointQuery += ` AND layer=${escapeSql(query.layer)}`;
    }

    console.log(pointQuery);

    featuresDbClient.queryDocuments(featuresCollection._self, pointQuery).toArray(callback);
}

function getByName(query, callback) {
    let namesDisjunction = query.name.split(',').map(function(name) { return `name ilike ${escapeSql(name)}`; }).join(" OR ");
    let nameQuery = `SELECT ${buildQueryColumns(query)} FROM features WHERE ${namesDisjunction}`;

    if (query.layer) {
        nameQuery += ` AND layer=${escapeSql(query.layer)}`;
    }

    executeQuery(nameQuery, callback);
}

function upsert(feature, callback) {
    let prefix = "";

    if (!feature.layer)      return callback(new ServiceError(HttpStatus.BAD_REQUEST, "'layer' not provided for feature."));
    if (!feature.name)       return callback(new ServiceError(HttpStatus.BAD_REQUEST, "'name' not provided for feature."));
    if (!feature.hull)       return callback(new ServiceError(HttpStatus.BAD_REQUEST, "'hull' not provided for feature."));
    if (!feature.properties) return callback(new ServiceError(HttpStatus.BAD_REQUEST, "'properties' not provided for feature."));

    feature.elevation = feature.elevation || null;
    feature.hierarchy = feature.hierarchy || '{}';

    featuresDbClient.upsertDocument(featuresCollection._self, feature, callback);
}

module.exports = {
    getById,
    getByBoundingBox,
    getByPoint,
    getByName,
    init,
    upsert,
};
