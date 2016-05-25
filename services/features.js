"use strict"

const async = require('async'),
      azure = require('azure-storage'),
      common = require('service-utils'),
      pg = require('pg'),
      GeoPoint = require('geopoint'),
      HttpStatus = require('http-status-codes'),
      JSONAPISerializer = require('jsonapi-serializer').Serializer,
      process = require('process'),
      ServiceError = common.utils.ServiceError;

const FEATURE_ATTRIBUTES = [
    'id',
    'name',
    'centroid',
    'fullTag',
    'category',
    'tag'
];

const WGS86 = 4326;

let featuresTable;

/*

CREATE EXTENSION postgis;

CREATE TABLE features
(
  id                bigint                      NOT NULL,

  name              character varying(128)      NOT NULL,

  centroid          geometry                    NOT NULL,

  fullTag           character varying(128)      NOT NULL,
  category          character varying(64)       NOT NULL,
  tag               character varying(64)       NOT NULL,

  CONSTRAINT nodes_pkey PRIMARY KEY (id),
  CONSTRAINT enforce_dims_centroid CHECK (st_ndims(centroid) = 2),
  CONSTRAINT enforce_geotype_centroid CHECK (geometrytype(centroid) = 'POINT'::text),
  CONSTRAINT enforce_srid_centroid CHECK (st_srid(centroid) = 4326)
);

GRANT SELECT, UPDATE, INSERT, DELETE ON nodes TO frontend;

CREATE INDEX features_centroid_index
  ON features
  USING gist
  (centroid);

CREATE INDEX features_fulltag_index
  ON features
  (fullTag);

*/

let featureSerializer = new JSONAPISerializer('feature', {
    attributes: FEATURE_ATTRIBUTES
});

function fromJsonApi(body, callback) {
    if (!body.data)
        return callback(new ServiceError(HttpStatus.BAD_REQUEST, "No data element included in request: " + JSON.stringify(body)));

    async.concat(body.data, function(element, elementCallback) {
        validate(element, function(err) {
            if (err) return elementCallback(err);

            var location = {};
            for (var key in element.attributes) {
                location[key] = element.attributes[key];
            }

            location.timestamp = new Date(location.timestamp);

            elementCallback(null, location);
        });
    }, callback);
}

function get(featureId, callback) {
    var getQuery = `SELECT * FROM features WHERE id = '${featureId}'`;

    featuresTable.query(getQuery, (err, results) => {
        if (err)
            return callback(err);
        else
            return callback(null, results.rows[0]);
    });
}

function getByBoundingBox(boundingBox, callback) {
    let boundingBoxQuery = `SELECT * FROM activities WHERE bbox && ST_MakeEnvelope(
        ${boundingBox.west}, ${boundingBox.south},
        ${boundingBox.east}, ${boundingBox.north}
    )`;

    featuresTable.query(boundingBoxQuery, (err, results) => {
        if (err)
            return callback(err);
        else
            return callback(null, results.rows);
    });
}

function init(callback) {
    if (!process.env.FEATURES_CONNECTION_STRING)
        return callback(new ServiceError(HttpStatus.INTERNAL_SERVER_ERROR, "FEATURES_CONNECTION_STRING configuration not provided as environment variable"));

    pg.connect(process.env.FEATURES_CONNECTION_STRING, function(err, client, done) {
        featuresTable = client;

        return callback(err);
    });
}

function toJsonApi(result, callback) {
    var resultJson = activitySerializer.serialize(result);

    if (!resultJson) {
        return callback(
            new ServiceError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Could not serialize location to JSON."
            )
        );
    }

    return callback(null, resultJson);
}

function upsert(feature, callback) {
    feature.name = feature.name || '';

    let upsertQuery = `INSERT INTO features (
        id, name, centroid, fullTag, category, tag
    ) VALUES (
        '${feature.id}',
        '${feature.name}',

        ST_SetSRID(
            ST_Point(${feature.centroid.lon}, ${feature.centroid.lat}), 4326
        ),

        '${feature.fullTag}',
        '${feature.category}',
        '${feature.tag}'
    ) ON CONFLICT (id) DO UPDATE SET
        name = '${feature.name}',

        centroid = ST_SetSRID(
            ST_Point(${feature.centroid.lon}, ${feature.centroid.lat}), 4326
        ),

        fullTag = '${feature.fullTag}',
        category = '${feature.category}',
        tag = '${feature.tag}'
    ;`;

    featuresTable.query(upsertQuery, (err, results) => {
        if (err) return callback(err);

        return callback(null, feature);
    });
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
    fromJsonApi:        fromJsonApi,
    get:                get,
    getByBoundingBox:   getByBoundingBox,
    init:               init,
    toJsonApi:          toJsonApi,
    upsert:             upsert,
};
