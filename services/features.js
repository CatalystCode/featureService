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
      url = require('url'),
      geojsonBbox = require('geojson-bbox');

/*

CREATE EXTENSION postgis;

CREATE TABLE features
(
  id                character varying(64)        NOT NULL,

  name              character varying(128)       NOT NULL,
  layer             character varying(32)        NOT NULL,

  properties        jsonb                        NOT NULL,

  bbox              geometry                     NOT NULL,
  centroid          geometry                     NOT NULL,
  hull              geometry                     NOT NULL,

  created_at        timestamp                    NOT NULL,
  updated_at        timestamp                    NOT NULL,

  CONSTRAINT nodes_pkey PRIMARY KEY (id),

  CONSTRAINT enforce_dims_centroid CHECK (st_ndims(centroid) = 2),
  CONSTRAINT enforce_srid_centroid CHECK (st_srid(centroid) = 4326),

  CONSTRAINT enforce_dims_bbox CHECK (st_ndims(bbox) = 2),
  CONSTRAINT enforce_srid_bbox CHECK (st_srid(bbox) = 4326),

  CONSTRAINT enforce_dims_hull CHECK (st_ndims(hull) = 2),
  CONSTRAINT enforce_srid_hull CHECK (st_srid(hull) = 4326)
);

GRANT SELECT, UPDATE, INSERT, DELETE ON features TO frontend;

CREATE INDEX features_hull_index
  ON features
  USING gist
  (hull);

*/

const COLUMN_QUERY = 'id, name, layer, properties, ST_AsGeoJSON(centroid) as centroid_geo_json, ST_AsGeoJSON(hull) as hull_geo_json';

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

function get(featureId, callback) {
    let getQuery = `SELECT ${COLUMN_QUERY} FROM features WHERE id = '${featureId}'`;
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
    row['centroid'] = JSON.parse(row['centroid_geo_json']);
    row['hull'] = JSON.parse(row['hull_geo_json']);

    delete row['created_at'];
    delete row['updated_at'];
    delete row['bbox'];
    delete row['centroid_geo_json'];
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

function geoJsonFilter(features, geojson) {
    let filteredFeatures = [];
    features.forEach(feature => {
        let intersects;
        let hullGeoJson = {
            type: "Feature",
            properties: {},
            geometry: feature.hull
        };

        if (geojson.geometry.type === "Polygon")
            intersects = turf.intersect(hullGeoJson, geojson);
        else
            intersects = turf.inside(geojson, hullGeoJson);

        if (intersects) {
            console.log('hit: ' + feature.names.common);
            filteredFeatures.push(feature);
        } else {
            console.log('miss: ' + feature.names.common);
        }
    });

    return filteredFeatures;
}

function bboxToGeoJson(bbox) {
    return {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Polygon",
        "coordinates":[
            [
                [bbox.west,bbox.north],
                [bbox.east,bbox.north],
                [bbox.east,bbox.south],
                [bbox.west,bbox.south],
                [bbox.west,bbox.north]
            ]
        ]
      }
    };
}

function pointToGeoJson(point) {
    return {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Point",
        "coordinates": [point.longitude, point.latitude]
      }
    };
}

function getByBoundingBox(boundingBox, callback) {
    let boundingBoxQuery = `SELECT ${COLUMN_QUERY} FROM features WHERE ST_Intersects(hull, ST_MakeEnvelope(
        ${boundingBox.west}, ${boundingBox.south},
        ${boundingBox.east}, ${boundingBox.north}, 4326
    ))`;

    return executeQuery(boundingBoxQuery, callback);
}

function getByPoint(point, callback) {
    let pointQuery = `SELECT ${COLUMN_QUERY} FROM features WHERE ST_Contains(hull, ST_GeomFromText(
        'POINT(${point.longitude} ${point.latitude})', 4326)
    );`

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
function summarizeByBoundingBox(boundingBox, callback) {
    common.utils.postgresClientWrapper(process.env.FEATURES_CONNECTION_STRING, (client, wrapperCallback) => {
        let boundingBoxQuery = `SELECT fullTag, count(*) FROM features WHERE ST_Intersects(centroid, ST_MakeEnvelope(
            ${boundingBox.west}, ${boundingBox.south},
            ${boundingBox.east}, ${boundingBox.north}, 4326
        )) GROUP BY fullTag`;

        client.query(boundingBoxQuery, (err, results) => {
            if (err) return wrapperCallback(err);

            return wrapperCallback(null, results.rows);
        });
    }, callback);
}
*/

function upsert(feature, callback) {
    let prefix = "";

    if (!feature.layer)      return callback(new ServiceError(HttpStatus.BAD_REQUEST, "'layer' not provided for feature."));
    if (!feature.name)       return callback(new ServiceError(HttpStatus.BAD_REQUEST, "'name' not provided for feature."));
    if (!feature.centroid)   return callback(new ServiceError(HttpStatus.BAD_REQUEST, "'centroid' not provided for feature."));
    if (!feature.hull)       return callback(new ServiceError(HttpStatus.BAD_REQUEST, "'hull' not provided for feature."));
    if (!feature.properties) return callback(new ServiceError(HttpStatus.BAD_REQUEST, "'properties' not provided for feature."));

    feature.elevation = feature.elevation || 'null';
    feature.hierarchy = feature.hierarchy || '{}';

    let extent = geojsonBbox(feature.hull);
    let bbox = turf.bboxPolygon(extent);

    let upsertQuery = `INSERT INTO features (
        id, name, layer, properties, hull, bbox, centroid, created_at, updated_at
    ) VALUES (
        '${feature.id}',
        '${feature.name.replace(/'/g,"''")}',
        '${feature.layer}',
        '${JSON.stringify(feature.properties).replace(/'/g,"''")}',

        ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(feature.hull)}'), 4326),
        ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(bbox.geometry)}'), 4326),
        ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(feature.centroid)}'), 4326),

        current_timestamp,
        current_timestamp
    ) ON CONFLICT (id) DO UPDATE SET
        name = '${feature.name.replace(/'/g,"''")}',
        layer = '${feature.layer}',
        properties = '${JSON.stringify(feature.properties).replace(/'/g,"''")}',

        hull = ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(feature.hull)}'), 4326),
        bbox = ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(bbox.geometry)}'), 4326),
        centroid = ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(feature.centroid)}'), 4326),

        updated_at = current_timestamp
    ;`;

    executeQuery(upsertQuery, callback);
}

module.exports = {
    get:                        get,
    getByBoundingBox:           getByBoundingBox,
    getByPoint:                 getByPoint,
    init:                       init,
//    summarizeByBoundingBox:     summarizeByBoundingBox,
    upsert:                     upsert
};
