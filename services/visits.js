"use strict"

const async = require('async'),
      azure = require('azure-storage'),
      common = require('service-utils'),
      HttpStatus = require('http-status-codes'),
      log = common.services.log("featureService/services/visits"),
      postgres = require('./postgres'),
      escapeSql = postgres.escapeSql,
      ServiceError = common.utils.ServiceError,
      uuid = require('uuid/v4');

let featureTablePool;
let redlock;

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
    executeQuery(`DELETE FROM visits WHERE user_id=${escapeSql(userId)}`, callback);
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
    executeQuery(`SELECT * FROM visits WHERE user_id=${escapeSql(userId)} AND start >= ${timestamp} AND finish <= ${timestamp}`, callback);
}

function getByUserId(userId, callback) {
    let query = `SELECT * FROM visits WHERE user_id=${escapeSql(userId)}`;
    executeQuery(query, callback);
}

function init(callback) {
    postgres.init(function(err, pool) {
        if (err) {
            return callback(err);
        }

        featureTablePool = pool;
        return callback();
    });
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
            ${escapeSql(visit.id)},
            ${escapeSql(visit.userId)},
            ${escapeSql(visit.featureId)},
            ${visit.start},
            ${visit.finish},
            current_timestamp,
            current_timestamp
        ) ON CONFLICT (id) DO UPDATE SET
            user_id = ${escapeSql(visit.userId)},
            feature_id = ${escapeSql(visit.featureId)},
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
