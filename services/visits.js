"use strict"

const async = require('async'),
      azure = require('azure-storage'),
      common = require('service-utils'),
      HttpStatus = require('http-status-codes'),
      process = require('process'),
      ServiceError = common.utils.ServiceError;

/*

CREATE TABLE visits
(
  id                uuid                         NOT NULL,
  user_id           character varying(128)       NOT NULL,
  feature_id        bigint                       NOT NULL,

  start             bigint                       NOT NULL,
  finish            bigint,

  created_at        timestamp                    NOT NULL,
  updated_at        timestamp                    NOT NULL,

  CONSTRAINT visits_pkey PRIMARY KEY (id)
);

GRANT SELECT, UPDATE, INSERT, DELETE ON visits TO frontend;

CREATE INDEX visits_finish_index
  ON visits
  (finish);

*/

function rowToVisit(row) {
    if (!row) return;

    row['featureId'] = row['feature_id'];
    row['userId'] = row['user_id'];
    row['createdAt'] = row['created_at'];
    row['updatedAt'] = row['updated_at'];

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

function fromJson(visitsJson, callback) {
    return callback(null, visitsJson);
}

function getVisits(scope, userId, callback) {
    common.utils.postgresClientWrapper(process.env.FEATURES_CONNECTION_STRING, (client, wrapperCallback) => {
        let visitsQuery = `SELECT * FROM visits WHERE user_id='${userId}'`;

        if (scope === 'open') {
            visitsQuery += ' AND finish IS NULL';
        }

        client.query(visitsQuery, (err, results) => {
            if (err) return wrapperCallback(err);

            return wrapperCallback(null, resultsToVisits(results));
        });
    }, callback);
}

function init(callback) {
    if (!process.env.FEATURES_CONNECTION_STRING)
        return callback(new ServiceError(HttpStatus.INTERNAL_SERVER_ERROR, "FEATURES_CONNECTION_STRING configuration not provided as environment variable"));

    return callback();
}

function upsert(visits, callback) {
    let prefix = "";

    visits.forEach(visit => {
        if (!visit.id)        return callback(new ServiceError(HttpStatus.BAD_REQUEST, "'id' not provided for visit."));
        if (!visit.userId)    return callback(new ServiceError(HttpStatus.BAD_REQUEST, "'userId' not provided for visit."));
        if (!visit.featureId) return callback(new ServiceError(HttpStatus.BAD_REQUEST, "'featureId' not provided for visit."));
        if (!visit.start)     return callback(new ServiceError(HttpStatus.BAD_REQUEST, "'start' not provided for visit."));
    });

    async.each(visits, (visit, visitCallback) => {
        let finishTimestamp = visit.finish || 'null';
        let upsertQuery = `INSERT INTO visits (
            id, user_id, feature_id, start, finish, created_at, updated_at
        ) VALUES (
            '${visit.id}',
            '${visit.userId}',
            ${visit.featureId},
            ${visit.start},
            ${finishTimestamp},
            current_timestamp,
            current_timestamp
        ) ON CONFLICT (id) DO UPDATE SET
            user_id  = '${visit.userId}',
            feature_id = ${visit.featureId},
            start = ${visit.start},
            finish = ${finishTimestamp},
            updated_at = current_timestamp
        ;`;

        common.utils.postgresClientWrapper(process.env.FEATURES_CONNECTION_STRING, (client, wrapperCallback) => {
            client.query(upsertQuery, (err, results) => {
                if (err) return wrapperCallback(err);

                return wrapperCallback(null, visit);
            });
        }, visitCallback);
    }, callback);
}

module.exports = {
    fromJson:                   fromJson,
    getVisits:                  getVisits,
    init:                       init,
    upsert:                     upsert,
};
