"use strict"

const async = require('async'),
      azure = require('azure-storage'),
      common = require('service-utils'),
      HttpStatus = require('http-status-codes'),
      log = common.services.log("featureService/services/visits"),
      pg = require('pg'),
      process = require('process'),
      ServiceError = common.utils.ServiceError,
      url = require('url'),
      uuid = require('uuid/v4');

let featureTablePool;
let redlock;

/*

CREATE EXTENSION postgis;

CREATE TABLE visits
(
  id                    uuid                         NOT NULL,
  user_id               character varying(128)       NOT NULL,
  feature_id            character varying(64)        NOT NULL,

  start                 bigint                       NOT NULL,
  finish                bigint                       NOT NULL,

  created_at            timestamp                    NOT NULL,
  updated_at            timestamp                    NOT NULL,

  CONSTRAINT visits_pkey PRIMARY KEY (id)
);

GRANT SELECT, UPDATE, INSERT, DELETE ON visits TO frontend;

CREATE INDEX visits_start_index
  ON visits
  (start);

CREATE INDEX visits_userid_index
  ON visits
  (user_id);

SELECT v.feature_id, count(v.feature_id), sum(v.finish-v.start) AS duration, f.name
FROM visits as v
JOIN features as f on f.id=v.feature_id
WHERE v.user_id='10152875766888406'
GROUP BY v.feature_id, f.name
ORDER BY duration DESC;

SELECT v.feature_id, f.name, v.start, v.finish, (v.finish-v.start)/1000 as duration
FROM visits as v
JOIN features as f on f.id=v.feature_id
WHERE v.user_id='10152875766888406'
ORDER BY v.start;

SELECT v.feature_id,
       (v.finish-v.start)/(1000*3600.0) AS duration,
       to_timestamp(v.start/1000.0) AT TIME ZONE 'PST' AS start,
       to_timestamp(v.finish/1000.0) AT TIME ZONE 'PST' AS finish,
       f.name
FROM visits as v
JOIN features as vi serf on f.id=v.feature_id
WHERE v.user_id='10152875766888406' and v.feature_id='wof-102191581'
ORDER BY duration DESC;

*/

function rowToVisit(row) {
    if (!row) return;

    row['featureId'] = row['feature_id'];
    row['userId'] = row['user_id'];
    row['createdAt'] = row['created_at'];
    row['updatedAt'] = row['updated_at'];

    row['start'] = parseInt(row['start']);
    row['finish'] = parseInt(row['finish']);

    delete row['feature_id'];
    delete row['user_id'];
    delete row['created_at'];
    delete row['updated_at'];

    return row;
}

function resultsToVisits(results) {
    let visits = [];

    results.rows.forEach(row => visits.push(rowToVisit(row)));

    return visits;
}

function deleteByUserId(userId, callback) {
    executeQuery(`DELETE FROM visits WHERE user_id='${userId}'`, callback);
}

function executeQuery(query, callback) {
    featureTablePool.connect((err, client, done) => {
        if (err) return callback(err);

        client.query(query, (err, results) => {
            done();

            if (err)
                return callback(err);
            else
                return callback(null, resultsToVisits(results));
        });
    });
}

function fromRequest(visitsJson, callback) {
    let visits = visitsJson.visits;
    visits.forEach(visit => {
        if (!visit.id)
            visit.id = uuid();
    });

    return callback(null, visits);
}

function getByTimestamp(userId, timestamp, callback) {
    executeQuery(`SELECT * FROM visits WHERE user_id='${userId}' AND start >= ${timestamp} AND finish <= ${timestamp}`, callback);
}

function getByUserId(userId, callback) {
    let query = `SELECT * FROM visits WHERE user_id='${userId}'`;
    executeQuery(query, callback);
}

function init(callback) {
    if (!process.env.FEATURES_CONNECTION_STRING)
        return callback(new ServiceError(HttpStatus.INTERNAL_SERVER_ERROR, "FEATURES_CONNECTION_STRING configuration not provided as environment variable"));

    // POSTGRES CONNECTION CODE

    log.info('connecting to features database using: ' + process.env.FEATURES_CONNECTION_STRING);

    const params = url.parse(process.env.FEATURES_CONNECTION_STRING);
    const auth = params.auth.split(':');

    const config = {
        user: auth[0],
        password: auth[1],
        host: params.hostname,
        port: params.port,
        database: params.pathname.split('/')[1]
    };

    featureTablePool = new pg.Pool(config);

    return callback();
}

function put(visits, callback) {
    if (!visits || visits.length === 0) return callback();

    deleteByUserId(visits[0].userId, err => {
        if (err) return callback(err);

        upsert(visits, callback);
    });
}

function toResponse(visits) {
    return {
        visits
    };
}

function upsert(visits, callback) {
    let prefix = "";

    visits.forEach(visit => {
        if (!visit.id)        return callback(new ServiceError(HttpStatus.BAD_REQUEST, "'id' not provided for visit: " + JSON.stringify(visit, null ,2)));
        if (!visit.userId)    return callback(new ServiceError(HttpStatus.BAD_REQUEST, "'userId' not provided for visit: " + JSON.stringify(visit, null ,2)));
        if (!visit.featureId) return callback(new ServiceError(HttpStatus.BAD_REQUEST, "'featureId' not provided for visit: " + JSON.stringify(visit, null ,2)));
        if (!visit.start)     return callback(new ServiceError(HttpStatus.BAD_REQUEST, "'start' not provided for visit: " + JSON.stringify(visit, null ,2)));
        if (!visit.finish)     return callback(new ServiceError(HttpStatus.BAD_REQUEST, "'finish' not provided for visit: " + JSON.stringify(visit, null ,2)));
    });

    async.each(visits, (visit, visitCallback) => {
        let upsertQuery = `INSERT INTO visits (
            id, user_id, feature_id, start, finish, created_at, updated_at
        ) VALUES (
            '${visit.id}',
            '${visit.userId}',
            '${visit.featureId}',
            ${visit.start},
            ${visit.finish},
            current_timestamp,
            current_timestamp
        ) ON CONFLICT (id) DO UPDATE SET
            user_id  = '${visit.userId}',
            feature_id = '${visit.featureId}',
            start = ${visit.start},
            finish = ${visit.finish},
            updated_at = current_timestamp
        ;`;

        executeQuery(upsertQuery, visitCallback);
    }, callback);
}

module.exports = {
    deleteByUserId,
    fromRequest,
    getByTimestamp,
    getByUserId,
    init,
    put,
    toResponse,
    upsert,
};
