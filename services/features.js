"use strict"

const async = require('async'),
      azure = require('azure-storage'),
      common = require('service-utils'),
      GeoPoint = require('geopoint'),
      HttpStatus = require('http-status-codes'),
      process = require('process'),
      ServiceError = common.utils.ServiceError,
      turf = require('turf'),
      geojsonBbox = require('geojson-bbox');

/*

CREATE EXTENSION postgis;

CREATE TABLE features
(
  id                character varying(64)        NOT NULL,

  names             jsonb                        NOT NULL,

  bbox              geometry                     NOT NULL,
  hull              geometry                     NOT NULL,

  centroid          geometry                     NOT NULL,

  hierarchy         jsonb                        NOT NULL,

  elevation         float,

  fulltag           character varying(128)       NOT NULL,
  category          character varying(64)        NOT NULL,
  tag               character varying(64)        NOT NULL,

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

    //row['hull'] = JSON.parse(row['hull_geo_json']);
    row['centroid'] = JSON.parse(row['centroid_geo_json']);
    //row['names'] = JSON.parse(row['names']);

    delete row['created_at'];
    delete row['updated_at'];
    //delete row['hull'];
    delete row['bbox'];
    //delete row['hull_geo_json'];
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

function geoJsonFilter(features, geojson) {
    let filteredFeatures = [];
    features.forEach(feature => {
        //console.log(JSON.stringify(feature));

        let intersects;
        let hullGeoJson = {
            type: "Feature",
            properties: {},
            geometry: feature.hull
        };

//        console.log(JSON.stringify(hullGeoJson));

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
    common.utils.postgresClientWrapper(process.env.FEATURES_CONNECTION_STRING, (client, wrapperCallback) => {
        let boundingBoxQuery = `SELECT id, names, ST_AsGeoJSON(centroid) as centroid_geo_json, category, tag, fulltag FROM features WHERE ST_Intersects(hull, ST_MakeEnvelope(
            ${boundingBox.west}, ${boundingBox.south},
            ${boundingBox.east}, ${boundingBox.north}, 4326
        ))`;

        client.query(boundingBoxQuery, (err, results) => {
            if (err) return wrapperCallback(err);

            let features = resultsToFeatures(results);
            //let bboxGeoJson = bboxToGeoJson(boundingBox);
            //let filteredFeatures = geoJsonFilter(features, bboxGeoJson);

            return wrapperCallback(null, features);
        });
    }, callback);
}

function getByPoint(point, callback) {
    common.utils.postgresClientWrapper(process.env.FEATURES_CONNECTION_STRING, (client, wrapperCallback) => {
        let pointQuery = `SELECT id, names, ST_AsGeoJSON(centroid) as centroid_geo_json, category, tag, fulltag FROM features WHERE ST_Contains(hull, ST_GeomFromText(
            'POINT(${point.longitude} ${point.latitude})', 4326)
        );`

        let id = Math.random();
        let startTime = new Date();

        client.query(pointQuery, (err, results) => {
            if (err) return wrapperCallback(err);
            let totalTime =  new Date().getTime() - startTime.getTime();
            //console.log('finished query: ' + pointQuery + ' total time: ' + totalTime);

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

function upsert(feature, callback) {
    let prefix = "";

    if (!feature.category) return callback(new ServiceError(HttpStatus.BAD_REQUEST, "'category' not provided for feature."));
    if (!feature.centroid) return callback(new ServiceError(HttpStatus.BAD_REQUEST, "'centroid' not provided for feature."));
    if (!feature.fullTag)  return callback(new ServiceError(HttpStatus.BAD_REQUEST, "'fullTag' not provided for feature."));
    if (!feature.hull)     return callback(new ServiceError(HttpStatus.BAD_REQUEST, "'hull' not provided for feature."));
    if (!feature.names)    return callback(new ServiceError(HttpStatus.BAD_REQUEST, "'name' not provided for feature."));
    if (!feature.tag)      return callback(new ServiceError(HttpStatus.BAD_REQUEST, "'tag' not provided for feature."));

    feature.elevation = feature.elevation || 'null';
    feature.hierarchy = feature.hierarchy || '{}';

    let extent = geojsonBbox(feature.hull);
    let bbox = turf.bboxPolygon(extent);

    let upsertQuery = `INSERT INTO features (
        id, names, hierarchy, hull, bbox, centroid, elevation, fullTag, category, tag, created_at, updated_at
    ) VALUES (
        ${feature.id},
        '${JSON.stringify(feature.names).replace(/'/g,"''")}',
        '${JSON.stringify(feature.hierarchy)}',

        ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(feature.hull)}'), 4326),
        ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(bbox.geometry)}'), 4326),
        ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(feature.centroid)}'), 4326),
        ${feature.elevation},

        '${feature.fullTag}',
        '${feature.category}',
        '${feature.tag}',

        current_timestamp,
        current_timestamp
    ) ON CONFLICT (id) DO UPDATE SET
        names = '${JSON.stringify(feature.names).replace(/'/g,"''")}',

        hull = ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(feature.hull)}'), 4326),
        bbox = ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(bbox.geometry)}'), 4326),
        centroid = ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(feature.centroid)}'), 4326),

        fullTag = '${feature.fullTag}',
        category = '${feature.category}',
        tag = '${feature.tag}',

        updated_at = current_timestamp
    ;`;

    common.utils.postgresClientWrapper(process.env.FEATURES_CONNECTION_STRING, (client, wrapperCallback) => {
        client.query(upsertQuery, (err, results) => {
            if (err) {
                common.services.log.error(`failed query: ${upsertQuery} with err: ${err}`);
                return wrapperCallback(err);
            }

            return wrapperCallback(null, feature);
        });
    }, callback);
}

function validate(activity, callback) {
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
