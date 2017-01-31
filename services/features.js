"use strict"

const async = require('async'),
      azure = require('azure-storage'),
      common = require('service-utils'),
      GeoPoint = require('geopoint'),
      HttpStatus = require('http-status-codes'),
      pg = require('pg'),
      process = require('process'),
      ServiceError = common.utils.ServiceError,
      turf = require('turf'),
      url = require('url');
/*

CREATE USER frontend PASSWORD '[euro4sure]';

CREATE EXTENSION postgis;

CREATE TABLE features
(
  id                character varying(64)        NOT NULL,

  name              character varying(128)       NOT NULL,
  layer             character varying(32)        NOT NULL,

  properties        jsonb                        NOT NULL,

  hull              geometry                     NOT NULL,

  created_at        timestamp                    NOT NULL,
  updated_at        timestamp                    NOT NULL,

  CONSTRAINT nodes_pkey PRIMARY KEY (id),

  CONSTRAINT enforce_srid_hull CHECK (st_srid(hull) = 4326)
);

GRANT SELECT, UPDATE, INSERT, DELETE ON features TO frontend;

CREATE INDEX features_hull_index
  ON features
  USING gist
  (hull);

*/

let featureDatabasePool;

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
    let getQuery = `SELECT ${buildQueryColumns(query)} FROM features WHERE id = '${query.id}'`;
    executeQuery(getQuery, (err, rows) => {
        if (err) return callback(err);
        if (!rows || rows.length === 0) return callback(null, null);

        return callback(null, rows[0]);
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
    let boundingBoxQuery = `SELECT ${buildQueryColumns(query)} FROM features WHERE ST_Intersects(hull, ST_MakeEnvelope(
        ${query.west}, ${query.south},
        ${query.east}, ${query.north}, 4326
    ))`;

    if (query.layer) {
        boundingBoxQuery += ` AND layer='${query.layer}'`;
    }

    return executeQuery(boundingBoxQuery, callback);
}

function getByPoint(query, callback) {
    let pointQuery = `SELECT ${buildQueryColumns(query)} FROM features WHERE ST_Contains(hull, ST_GeomFromText(
        'POINT(${query.longitude} ${query.latitude})', 4326)
    )`;

    if (query.layer) {
        pointQuery += ` AND layer='${query.layer}'`;
    }

    return executeQuery(pointQuery, callback);
}

function init(callback) {
    if (!process.env.FEATURES_CONNECTION_STRING)
        return callback(new ServiceError(HttpStatus.INTERNAL_SERVER_ERROR, "FEATURES_CONNECTION_STRING configuration not provided as environment variable"));

    const params = url.parse(process.env.FEATURES_CONNECTION_STRING);
    const auth = params.auth.split(':');

    const config = {
        user: auth[0],
        password: auth[1],
        host: params.hostname,
        port: params.port,
        database: params.pathname.split('/')[1]
    };

    featureDatabasePool = new pg.Pool(config);

    return callback();
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
        '${feature.id}',
        '${feature.name.replace(/'/g,"''")}',
        '${feature.layer}',
        '${JSON.stringify(feature.properties).replace(/'/g,"''")}',

        ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(feature.hull)}'), 4326),

        current_timestamp,
        current_timestamp
    ) ON CONFLICT (id) DO UPDATE SET
        name = '${feature.name.replace(/'/g,"''")}',
        layer = '${feature.layer}',
        properties = '${JSON.stringify(feature.properties).replace(/'/g,"''")}',

        hull = ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(feature.hull)}'), 4326),

        updated_at = current_timestamp
    ;`;

    executeQuery(upsertQuery, callback);
}

module.exports = {
    getById,
    getByBoundingBox,
    getByPoint,
    init,
/*  intersectLocations, */
    upsert,
};
