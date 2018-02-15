'use strict';

const
    async = require('async'),
    common = require('service-utils'),
    HttpStatus = require('http-status-codes'),
    postgres = require('./postgres'),
    ServiceError = common.utils.ServiceError,
    uuid = require('uuid/v4');

let featureTablePool;

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
    const query = 'DELETE FROM visits WHERE user_id = $1';
    const params = [userId];

    executeQuery(query, params, callback);
}

function executeQuery(query, params, callback) {
    featureTablePool.connect((err, client, done) => {
        if (err) {
            console.error(err);
            return callback(new ServiceError(HttpStatus.INTERNAL_SERVER_ERROR, 'Error connecting to the visits DB'));
        }

        client.query(query, params, (err, results) => {
            done();

            if (err) {
                console.error(err);
                return callback(new ServiceError(HttpStatus.INTERNAL_SERVER_ERROR, 'Error querying the visits DB'));
            } else {
                return callback(null, resultsToVisits(results));
            }
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
    const query = 'SELECT * FROM visits WHERE user_id = $1 AND start >= $2 AND finish <= $3';
    const params = [userId, timestamp, timestamp];

    executeQuery(query, params, callback);
}

function getByUserId(userId, callback) {
    const query = 'SELECT * FROM visits WHERE user_id = $1';
    const params = [userId];

    executeQuery(query, params, callback);
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
    visits.forEach(visit => {
        if (!visit.id)        return callback(new ServiceError(HttpStatus.BAD_REQUEST, '\'id\' not provided for visit: ' + JSON.stringify(visit, null ,2)));
        if (!visit.userId)    return callback(new ServiceError(HttpStatus.BAD_REQUEST, '\'userId\' not provided for visit: ' + JSON.stringify(visit, null ,2)));
        if (!visit.featureId) return callback(new ServiceError(HttpStatus.BAD_REQUEST, '\'featureId\' not provided for visit: ' + JSON.stringify(visit, null ,2)));
        if (!visit.start)     return callback(new ServiceError(HttpStatus.BAD_REQUEST, '\'start\' not provided for visit: ' + JSON.stringify(visit, null ,2)));
        if (!visit.finish)     return callback(new ServiceError(HttpStatus.BAD_REQUEST, '\'finish\' not provided for visit: ' + JSON.stringify(visit, null ,2)));
    });

    async.each(visits, (visit, visitCallback) => {
        const upsertQuery = `INSERT INTO visits (
            id, user_id, feature_id, start, finish, created_at, updated_at
        ) VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            current_timestamp,
            current_timestamp
        ) ON CONFLICT (id) DO UPDATE SET
            user_id = $6,
            feature_id = $7,
            start = $8,
            finish = $9,
            updated_at = current_timestamp
        ;`;

        const upsertParams = [
            visit.id, visit.userId, visit.featureId, visit.start, visit.finish,
            visit.userId, visit.featureId, visit.start, visit.finish,
        ];

        executeQuery(upsertQuery, upsertParams, visitCallback);
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
