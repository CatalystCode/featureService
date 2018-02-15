'use strict';

const
    common = require('service-utils'),
    HttpStatus = require('http-status-codes'),
    postgres = require('./postgres'),
    ServiceError = common.utils.ServiceError;

let featureDatabasePool;

function executeQuery(query, params, callback) {
    featureDatabasePool.connect((err, client, done) => {
        if (err) {
            console.error(err);
            return callback(new ServiceError(HttpStatus.INTERNAL_SERVER_ERROR, 'Error connecting to the features DB'));
        }

        client.query(query, params, (err, results) => {
            done();

            if (err) {
                console.error(err);
                return callback(new ServiceError(HttpStatus.INTERNAL_SERVER_ERROR, 'Error querying the features DB'));
            } else {
                return callback(null, resultsToFeatures(results));
            }
        });
    });
}

function getById(query, callback) {
    const ids = query.id.constructor === Array ? query.id : [query.id];

    const getParams = [];

    const getQuery = `SELECT ${buildQueryColumns(query)} FROM features WHERE id IN (${ids.map(id => {
        getParams.push(id);
        return `$${getParams.length}`;
    }).join(',')})`;

    executeQuery(getQuery, getParams, (err, rows) => {
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

    const x = coords[0]; // longitude
    const y = coords[1]; // latitude

    return [x, y];
}

function rowToFeature(row) {
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

function addQueryPredicates(sql, query, params) {
    if (query.layer) {
        params.push(query.layer);
        sql += ` AND layer = $${params.length}`;
    }

    if (query.filter_name) {
        params.push(query.filter_name);
        sql += ` AND strpos(lower(name), lower($${params.length})) > 0`;
    }

    if (query.filter_namespace) {
        params.push(query.filter_namespace);
        sql += ` AND lower(split_part(id, '-', 1)) = lower($${params.length})`;
    }

    if (query.filter_layer) {
        sql += ` AND lower(layer) IN (${query.filter_layer.split(',').map(layer => {
            params.push(layer);
            return `lower($${params.length})`;
        }).join(',')})`;
    }

    return sql;
}

function getByBoundingBox(query, callback) {
    let boundingBoxQuery = `SELECT ${buildQueryColumns(query)} FROM features WHERE ST_Intersects(hull, ST_MakeEnvelope(
        $1, $2,
        $3, $4, 4326
    ))`;

    const boundingBoxParams = [query.west, query.south, query.east, query.north];

    boundingBoxQuery = addQueryPredicates(boundingBoxQuery, query, boundingBoxParams);

    return executeQuery(boundingBoxQuery, boundingBoxParams, callback);
}

function getByPoint(query, callback) {
    let pointQuery = `SELECT ${buildQueryColumns(query)} FROM features WHERE ST_Contains(hull,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)
    )`;

    const pointParams = [query.longitude, query.latitude];

    pointQuery = addQueryPredicates(pointQuery, query, pointParams);

    return executeQuery(pointQuery, pointParams, callback);
}

function getByName(query, callback) {
    const names = query.name.constructor === Array ? query.name : [query.name];

    const nameParams = [];

    const namesDisjunction = `(${names.map(name => {
        nameParams.push(name);
        return `lower(name) = lower($${nameParams.length})`;
    }).join(' OR ')})`;

    let nameQuery = `SELECT ${buildQueryColumns(query)} FROM features WHERE ${namesDisjunction}`;

    nameQuery = addQueryPredicates(nameQuery, query, nameParams);

    executeQuery(nameQuery, nameParams, callback);
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
    if (!feature.layer)      return callback(new ServiceError(HttpStatus.BAD_REQUEST, '\'layer\' not provided for feature.'));
    if (!feature.name)       return callback(new ServiceError(HttpStatus.BAD_REQUEST, '\'name\' not provided for feature.'));
    if (!feature.hull)       return callback(new ServiceError(HttpStatus.BAD_REQUEST, '\'hull\' not provided for feature.'));
    if (!feature.properties) return callback(new ServiceError(HttpStatus.BAD_REQUEST, '\'properties\' not provided for feature.'));

    feature.elevation = feature.elevation || 'null';
    feature.hierarchy = feature.hierarchy || '{}';

    const upsertQuery = `
    INSERT INTO features (
        id, name, layer, properties, hull, created_at, updated_at
    ) VALUES (
        $1,
        $2,
        $3,
        $4,

        ST_SetSRID(ST_GeomFromGeoJSON($5), 4326),

        current_timestamp,
        current_timestamp
    ) ON CONFLICT (id) DO UPDATE SET
        name = $6,
        layer = $7,
        properties = $8,

        hull = ST_SetSRID(ST_GeomFromGeoJSON($9), 4326),

        updated_at = current_timestamp
    ;`;

    const hullJson = JSON.stringify(feature.hull);
    const propertiesJson = JSON.stringify(feature.properties);

    const upsertParams = [
        feature.id, feature.name, feature.layer, propertiesJson,
        hullJson, feature.name, feature.layer, propertiesJson,
        hullJson,
    ];

    executeQuery(upsertQuery, upsertParams, callback);
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
