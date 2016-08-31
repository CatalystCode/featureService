"use strict"

const async = require('async'),
      azure = require('azure-storage'),
      common = require('service-utils'),
      GeoPoint = require('geopoint'),
      HttpStatus = require('http-status-codes'),
      process = require('process'),
      ServiceError = common.utils.ServiceError;

const FEATURE_ATTRIBUTES = [
    'id',
    'name',
    'centroid',
    'fullTag',
    'category',
    'tag',
    'imported_at'
];

const NODE_FEATURE_BBOX_DELTA = 0.0003;

/*

CREATE EXTENSION postgis;

CREATE TABLE features
(
  id                bigint                       NOT NULL,

  names             jsonb                        NOT NULL,

  hull              geometry                     NOT NULL,
  centroid          geometry                     NOT NULL,

  elevation         float,

  fulltag           character varying(128)       NOT NULL,
  category          character varying(64)        NOT NULL,
  tag               character varying(64)        NOT NULL,

  created_at         timestamp                   NOT NULL,
  updated_at         timestamp                   NOT NULL,

  CONSTRAINT nodes_pkey PRIMARY KEY (id),

  CONSTRAINT enforce_dims_centroid CHECK (st_ndims(centroid) = 2),
  CONSTRAINT enforce_srid_centroid CHECK (st_srid(centroid) = 4326),

  CONSTRAINT enforce_dims_hull CHECK (st_ndims(hull) = 2),
  CONSTRAINT enforce_srid_hull CHECK (st_srid(hull) = 4326)
);

CREATE ROLE frontend WITH PASSWORD '[euro4sure]';
ALTER ROLE frontend LOGIN;
GRANT SELECT, UPDATE, INSERT, DELETE ON features TO frontend;

CREATE INDEX features_centroid_index
  ON features
  USING gist
  (centroid);

CREATE INDEX features_hull_index
  ON features
  USING gist
  (hull);

CREATE INDEX features_fulltag_index
  ON features
  (fulltag);

*/

function get(featureId, callback) {
    common.utils.postgresClientWrapper(process.env.FEATURES_CONNECTION_STRING, (client, wrapperCallback) => {
        let getQuery = `SELECT *, ST_AsGeoJSON(hull) as hull_geo_json, ST_AsGeoJSON(centroid) as centroid_geo_json FROM features WHERE id = '${featureId}'`;

        client.query(getQuery, (err, results) => {
            if (err) return callback(err);
            return callback(null, rowToFeature(results.rows[0]));
        });
    }, callback);
}

function rowToFeature(row) {
    if (!row) return;

    row['createdAt'] = row['created_at'];
    row['updatedAt'] = row['updated_at'];

    row['hull'] = JSON.parse(row['hull_geo_json']);
    row['centroid'] = JSON.parse(row['centroid_geo_json']);

    delete row['created_at'];
    delete row['updated_at'];
    delete row['hull_geo_json'];
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

function getByBoundingBox(boundingBox, callback) {
    common.utils.postgresClientWrapper(process.env.FEATURES_CONNECTION_STRING, (client, wrapperCallback) => {
        let boundingBoxQuery = `SELECT *, ST_AsGeoJSON(hull) as hull_geo_json, ST_AsGeoJSON(centroid) as centroid_geo_json FROM features WHERE hull && ST_MakeEnvelope(
            ${boundingBox.west}, ${boundingBox.south},
            ${boundingBox.east}, ${boundingBox.north}
        )`;

        client.query(boundingBoxQuery, (err, results) => {
            if (err) return wrapperCallback(err);

            let features = resultsToFeatures(results);

            return wrapperCallback(null, features);
        });
    }, callback);
}

function getByPoint(point, callback) {
    common.utils.postgresClientWrapper(process.env.FEATURES_CONNECTION_STRING, (client, wrapperCallback) => {
        let pointQuery = `SELECT *, ST_AsGeoJSON(hull) as hull_geo_json, ST_AsGeoJSON(centroid) as centroid_geo_json FROM features WHERE ST_Contains(hull, ST_GeomFromText(
            'POINT(${point.longitude} ${point.latitude})', 4326)
        );`

        client.query(pointQuery, (err, results) => {
            if (err) return wrapperCallback(err);

            let features = resultsToFeatures(results);

            return wrapperCallback(null, features);
        });
    }, callback);
}

function init(callback) {
    if (!process.env.FEATURES_CONNECTION_STRING)
        return callback(new ServiceError(HttpStatus.INTERNAL_SERVER_ERROR, "FEATURES_CONNECTION_STRING configuration not provided as environment variable"));

    return callback();
}

function summarizeByBoundingBox(boundingBox, callback) {
    common.utils.postgresClientWrapper(process.env.FEATURES_CONNECTION_STRING, (client, wrapperCallback) => {
        let boundingBoxQuery = `SELECT fullTag, count(*) FROM features WHERE centroid && ST_MakeEnvelope(
            ${boundingBox.west}, ${boundingBox.south},
            ${boundingBox.east}, ${boundingBox.north}
        ) GROUP BY fullTag`;

        client.query(boundingBoxQuery, (err, results) => {
            if (err) return wrapperCallback(err);

            return wrapperCallback(null, results.rows);
        });
    }, callback);
}

function upsert(feature, callback) {
    let prefix = "";

    let upsertQuery = `INSERT INTO features (
        id, names, hull, centroid, fullTag, category, tag, created_at, updated_at
    ) VALUES (
        ${feature.id},
        '${JSON.stringify(feature.names).replace(/'/g,"''")}',

        ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(feature.geometry)}'), 4326),
        ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(feature.centroid)}'), 4326),

        '${feature.fullTag}',
        '${feature.category}',
        '${feature.tag}',

        current_timestamp,
        current_timestamp
    ) ON CONFLICT (id) DO UPDATE SET
        names = '${JSON.stringify(feature.names).replace(/'/g,"''")}',

        hull = ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(feature.geometry)}'), 4326),
        centroid = ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(feature.centroid)}'), 4326),

        fullTag = '${feature.fullTag}',
        category = '${feature.category}',
        tag = '${feature.tag}',
        updated_at = current_timestamp
    ;`;

    common.utils.postgresClientWrapper(process.env.FEATURES_CONNECTION_STRING, (client, wrapperCallback) => {
        client.query(upsertQuery, (err, results) => {
            if (err) return wrapperCallback(err);

            return wrapperCallback(null, feature);
        });
    }, callback);
}

function validate(activity, callback) {
/*
    if (activity.type !== 'activity')
        return callback(new ServiceError(HttpStatus.BAD_REQUEST, "Expected data of type 'activity'."));

    if (!activity.attributes)
        return callback(new ServiceError(HttpStatus.BAD_REQUEST, "Location missing attributes."));

    if (!activity.attributes.start)
        return callback(new ServiceError(HttpStatus.BAD_REQUEST, "Location missing required attribute 'start'."));

    if (!location.attributes.finish)
        return callback(new ServiceError(HttpStatus.BAD_REQUEST, "Location missing required attribute 'finish'."));
*/
    return callback();
};

module.exports = {
    get:                        get,
    getByBoundingBox:           getByBoundingBox,
    getByPoint:                 getByPoint,
    init:                       init,
    summarizeByBoundingBox:     summarizeByBoundingBox,
    upsert:                     upsert,
};
