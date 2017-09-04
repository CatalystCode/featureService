"use strict"

const async = require('async'),
      azure = require('azure-storage'),
      common = require('service-utils'),
      GeoPoint = require('geopoint'),
      HttpStatus = require('http-status-codes'),
      postgres = require('./postgres'),
      ServiceError = common.utils.ServiceError,
      turf = require('turf');

let featureDatabasePool;

function escapeSql(value) {
    return `'${value.replace(/'/g,"''")}'`;
}

function executeQuery(query, callback) {
    featureDatabasePool.connect((err, client, done) => {
        if (err) return callback(err);

        client.query(query, (err, results) => {
            done();

            if (err)
                return callback(err);
            else
                return callback(null, resultsToFeatures(results));
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

function parseBoundingBox(bbox_geo_json) {
    const feature = JSON.parse(bbox_geo_json);
    const coords = feature.coordinates && feature.coordinates[0];
    if (feature.type !== 'Polygon' || coords.length !== 5) {
        return null;
    }

    const xs = coords.map(point => point[0]);
    const ys = coords.map(point => point[1]);

    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    return [
        maxY, // north
        minX, // west
        minY, // south
        maxX // east
    ];
}

function parseCentroid(centroid_geo_json) {
    const feature = JSON.parse(centroid_geo_json);
    const coords = feature.coordinates;
    if (feature.type !== 'Point' || coords.length !== 2) {
        return null;
    }

    const x = coords[0];
    const y = coords[1];

    return [x, y];
}

function rowToFeature(row, columns) {
    if (!row) return;

    row['createdAt'] = row['created_at'];
    row['updatedAt'] = row['updated_at'];
    if (row['hull_geo_json']) row['hull'] = JSON.parse(row['hull_geo_json']);
    if (row['bbox_geo_json']) row['bbox'] = parseBoundingBox(row['bbox_geo_json']);
    if (row['centroid_geo_json']) row['centroid'] = parseCentroid(row['centroid_geo_json']);

    delete row['created_at'];
    delete row['updated_at'];
    delete row['hull_geo_json'];
    delete row['bbox_geo_json'];
    delete row['centroid_geo_json'];

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

        if (includeArray.indexOf('bbox') !== -1) queryColumns += ',ST_AsGeoJSON(ST_Envelope(hull)) as bbox_geo_json';
        if (includeArray.indexOf('centroid') !== -1) queryColumns += ',ST_AsGeoJSON(ST_Centroid(hull)) as centroid_geo_json';
        if (includeArray.indexOf('hull') !== -1) queryColumns += ',ST_AsGeoJSON(hull) as hull_geo_json';
        if (includeArray.indexOf('properties') !== -1) queryColumns += ',properties';
    }

    return queryColumns;
}

function getByBoundingBox(query, callback) {
    let boundingBoxQuery = `SELECT ${buildQueryColumns(query)} FROM features WHERE ST_Intersects(hull, ST_MakeEnvelope(
        ${query.west}, ${query.south},
        ${query.east}, ${query.north}, 4326
    ))`;

    if (query.layer) {
        boundingBoxQuery += ` AND layer=${escapeSql(query.layer)}`;
    }

    return executeQuery(boundingBoxQuery, callback);
}

function getByPoint(query, callback) {
    let pointQuery = `SELECT ${buildQueryColumns(query)} FROM features WHERE ST_Contains(hull, ST_GeomFromText(
        'POINT(${query.longitude} ${query.latitude})', 4326)
    )`;

    if (query.layer) {
        pointQuery += ` AND layer=${escapeSql(query.layer)}`;
    }

    return executeQuery(pointQuery, callback);
}

function getByName(query, callback) {
    const names = query.name.constructor === Array ? query.name : [query.name];

    let namesDisjunction = names.map(function(name) {
        return `lower(name) = ${escapeSql(name.toLowerCase())}`;
    }).join(" OR ");
    let nameQuery = `SELECT ${buildQueryColumns(query)} FROM features WHERE ${namesDisjunction}`;

    if (query.layer) {
        nameQuery += ` AND layer=${escapeSql(query.layer)}`;
    }

    executeQuery(nameQuery, callback);
}

function init(callback) {
    postgres.init(function(err, pool) {
        if (err) {
            return callback(err);
        }

        featureDatabasePool = pool;
        return callback();
    });
}

/*
function intersectLocations(locations, callback) {
    let intersections = [];
    async.eachLimit(locations, 100, (location, locationCallback) => {
        getByPoint({
            latitude: location.latitude,
            longitude: location.longitude
        }, (err, features) => {
            if (err) return locationCallback(err);

            let simplifiedFeatures = features.map(feature => {
                return {
                    id: feature.id,
                    properties: feature.properties
                };
            });

            let intersection = {
                features: simplifiedFeatures,
                timestamp: location.timestamp,
                userId: location.userId
            };

            intersections.push(intersection);

            return locationCallback();
        });
    }, err => {
        return callback(err, intersections);
    });
}
*/

function upsert(feature, callback) {
    let prefix = "";

    if (!feature.layer)      return callback(new ServiceError(HttpStatus.BAD_REQUEST, "'layer' not provided for feature."));
    if (!feature.name)       return callback(new ServiceError(HttpStatus.BAD_REQUEST, "'name' not provided for feature."));
    if (!feature.hull)       return callback(new ServiceError(HttpStatus.BAD_REQUEST, "'hull' not provided for feature."));
    if (!feature.properties) return callback(new ServiceError(HttpStatus.BAD_REQUEST, "'properties' not provided for feature."));

    feature.elevation = feature.elevation || 'null';
    feature.hierarchy = feature.hierarchy || '{}';

    let upsertQuery = `INSERT INTO features (
        id, name, layer, properties, hull, created_at, updated_at
    ) VALUES (
        ${escapeSql(feature.id)},
        ${escapeSql(feature.name)},
        ${escapeSql(feature.layer)},
        ${escapeSql(JSON.stringify(feature.properties))},

        ST_SetSRID(ST_GeomFromGeoJSON(${escapeSql(JSON.stringify(feature.hull))}), 4326),

        current_timestamp,
        current_timestamp
    ) ON CONFLICT (id) DO UPDATE SET
        name = ${escapeSql(feature.name)},
        layer = ${escapeSql(feature.layer)},
        properties = ${escapeSql(JSON.stringify(feature.properties))},

        hull = ST_SetSRID(ST_GeomFromGeoJSON(${escapeSql(JSON.stringify(feature.hull))}), 4326),

        updated_at = current_timestamp
    ;`;

    executeQuery(upsertQuery, callback);
}

module.exports = {
    getById,
    getByBoundingBox,
    getByPoint,
    getByName,
    init,
/*  intersectLocations, */
    upsert,
};
