"use strict"

const async = require('async'),
      azure = require('azure-storage'),
      common = require('service-utils'),
      log = common.services.log,
      HttpStatus = require('http-status-codes'),
      process = require('process'),
      ServiceError = common.utils.ServiceError,
      uuid = require('uuid/v4');

/*

CREATE TABLE visits
(
  id                    uuid                         NOT NULL,
  user_id               character varying(128)       NOT NULL,
  feature_id            character varying(64)        NOT NULL,

  start                 bigint                       NOT NULL,
  start_intersection    jsonb                        NOT NULL,
  finish                bigint                       NOT NULL,
  finish_intersection   jsonb                        NOT NULL,

  created_at            timestamp                    NOT NULL,
  updated_at            timestamp                    NOT NULL,

  CONSTRAINT visits_pkey PRIMARY KEY (id)
);

GRANT SELECT, UPDATE, INSERT, DELETE ON visits TO frontend;

CREATE INDEX visits_start_index
  ON visits
  (start);

CREATE INDEX visits_finish_index
  ON visits
  (finish);

*/

function rowToVisit(row) {
    if (!row) return;

    row['featureId'] = row['feature_id'];
    row['userId'] = row['user_id'];
    row['startIntersection'] = row['start_intersection'];
    row['finishIntersection'] = row['finish_intersection'];
    row['createdAt'] = row['created_at'];
    row['updatedAt'] = row['updated_at'];

    delete row['feature_id'];
    delete row['user_id'];
    delete row['start_intersection'];
    delete row['finish_intersection'];
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
    let parsedVisitsJson = visitsJson.visits.map(visitJson => {
        visitJson.start = Date.parse(visitJson.start);
        return visitJson;
    });

    return callback(null, {visits: parsedVisitsJson});
}

function executeQuery(query, callback) {
    common.utils.postgresClientWrapper(process.env.FEATURES_CONNECTION_STRING, (client, wrapperCallback) => {
        client.query(query, (err, results) => {
            if (err) return wrapperCallback(err);

            return wrapperCallback(null, resultsToVisits(results));
        });
    }, callback);
}

function getByTimestamp(userId, timestamp, callback) {
    executeQuery(`SELECT * FROM visits WHERE user_id='${userId}' AND start >= ${timestamp} AND finish <= ${timestamp}`, callback);
}

function getLastBeforeTimestamp(userId, timestamp, callback) {
    executeQuery(`SELECT * FROM visits WHERE user_id='${userId}' AND finish < ${timestamp} ORDER BY finish DESC LIMIT 1`, callback);
}

function getNextAfterTimestamp(userId, timestamp, callback) {
    executeQuery(`SELECT * FROM visits WHERE user_id='${userId}' AND start > ${timestamp} ORDER BY start ASC LIMIT 1`, callback);
}

function getVisits(userId, options, callback) {
    let query = `SELECT * FROM visits WHERE user_id='${userId}'`;
    executeQuery(query, callback);
}

function init(callback) {
    if (!process.env.FEATURES_CONNECTION_STRING)
        return callback(new ServiceError(HttpStatus.INTERNAL_SERVER_ERROR, "FEATURES_CONNECTION_STRING configuration not provided as environment variable"));

    return callback();
}

/*

#1  ['CA','SC'] @ 2

current: []
idx ==> 0

for 'CA' / 'SC':
    does not find beforeVisit
    does not find afterVisit
    creates visit

#2 ['CA','AP'] @ 5

current: [
    { id: '1',
      featureId: 'CA',
      start: 2,
      startIntersections: ['CA', 'SC'],
      finish: 2,
      finishIntersections: ['CA', 'SC']
    },
    { id: '2',
      featureId: 'SC',
      start: 2,
      startIntersections: ['CA', 'SC'],
      finish: 2,
      finishIntersections: ['CA', 'SC']
    }
]

idx ==> 1

for intersection CA:
    find beforeVisit == '1'
    extend finish to 5

for intersection AP:
    don't find beforeVisit
    don't find afterVisit
    create visit

#3 ['CA','SC'] @ 1

current: [
    { id: '1',
      featureId: 'CA',
      start: 2,
      startIntersections: ['CA', 'SC'],
      finish: 5,
      finishIntersections: ['CA', 'AP']
    },
    { id: '2',
      featureId: 'SC',
      start: 2,
      startIntersections: ['CA', 'SC'],
      finish: 2,
      finishIntersections: ['CA', 'SC']
    },
    { id: '3',
      featureId: 'AP',
      start: 5,
      startIntersections: ['CA', 'AP'],
      finish: 5,
      finishIntersections: ['CA', 'AP']
    },
]

idx => 0

for intersection 'CA'/'SC':
    don't find before event
    find after visit '1' and '2'
    pre-extend it

#4 ['CA','AP'] @3

current: [
    { id: '1',
      featureId: 'CA',
      start: 1,
      startIntersections: ['CA', 'SC'],
      finish: 5,
      finishIntersections: ['CA', 'AP']
    },
    { id: '2',
      featureId: 'SC',
      start: 1,
      startIntersections: ['CA', 'SC'],
      finish: 2,
      finishIntersections: ['CA', 'SC']
    },
    { id: '3',
      featureId: 'AP',
      start: 5,
      startIntersections: ['CA', 'AP'],
      finish: 5,
      finishIntersections: ['CA', 'AP']
    },
]

idx ==> 2

for intersection 'CA':
    find beforeVisit '1'
    noop since finish is after 3 and start is before 3

for intersection 'AP':
    don't find beforeVisit
    find afterVisit '3'
    preextend

#5 ['CA','SC'] @ 4

current: [
    { id: '1',
      featureId: 'CA',
      start: 1, x
      startIntersections: ['CA', 'SC'],
      finish: 5,
      finishIntersections: ['CA', 'AP'] }
    },
    { id: '2',
      featureId: 'SC',
      start: 1, x
      startIntersections: ['CA', 'SC'],
      finish: 2, x
      finishIntersections: ['CA', 'SC']
    },
    { id: '3',
      featureId: 'AP',
      start: 3,
      startIntersections: ['CA', 'AP'],
      finish: 5,
      finishIntersections: ['CA', 'AP']
    }
]

{@1, '1', 'CA', start, intersections: ['CA', 'SC'] }
{@1, '2', 'SC', start, intersections: ['CA', 'SC'] }
{@2, '2', 'SC', finish, intersections: ['CA', 'SC'] }
{@3, '3', 'AP', start, intersections: ['CA', 'AP'] }
idx==>
{@5, '1', 'CA', finish, intersections: ['CA', 'AP'] }
{@5, '1', 'AP', finish, intersections: ['CA', 'AP'] }

for 'CA':
    backVisit selected as '1'
    nop because visit within current bounds
for 'SC':
    no backvisit because @3 doesn't have SC
    no afterVisit because @5 doesn't have SC
    create new visit for SC.

    check spanning visits break up '3'

FINAL

current: [
    { id: '1',
      featureId: 'CA',
      start: 1, x
      startIntersections: ['CA', 'SC'],
      finish: 5,
      finishIntersections: ['CA', 'AP'] }
    },
    { id: '2',
      featureId: 'SC',
      start: 1, x
      startIntersections: ['CA', 'SC'],
      finish: 2, x
      finishIntersections: ['CA', 'SC']
    },
    { id: '3',
      featureId: 'AP',
      start: 3,
      startIntersections: ['CA', 'AP'],
      finish: 4,
      finishIntersections: ['CA', 'SC']
    },
    { id: '4',
      featureId: 'SC',
      start: 4,
      startIntersections: ['CA', 'SC'],
      finish: 4,
      finishIntersections: ['CA', 'SC']
    },
    { id: '5',
      featureId: 'AP',
      start: 4,
      startIntersections: ['CA', 'SC'],
      finish: 5,
      finishIntersections: ['CA', 'AP']
    },
]

ALGORITHM

scan for position before ts==2
=> index ==> 0
for each feature,
    attempt to select beforeVisits before insertionIndex
    can't select beforeVisit if we run into an event without this feature.
    if can't find this, attempt to select afterVisit after insertionIndex.
    can't select afterVisit if we run into an event without this feature.
    if we can't find either before or after visit, create a new open visit.

    pull spanning visits (where 'start' is before index and 'finish' is after index)
    => visit '1' and '3'
    => 1's CA is included in intersections => noop
    => 3's AP is not, so split at intersection

next: [
    {featureId: 'CA', start: 2, startIntersections: { ts: 2, features: ['CA', 'SC'] } }
]

*/

function visitsToEvents(visits) {
    let events = [];
    Object.keys(visits).forEach(visitId => {
        let visit = visits[visitId];
        events.push({
            visitId: visit.id,
            timestamp: visit.start,
            featureId: visit.featureId,
            type: 'start',
            features: visit.startIntersection.features
        });

        if (visit.finish) {
            events.push({
                visitId: visit.id,
                timestamp: visit.finish,
                featureId: visit.featureId,
                type: 'finish',
                features: visit.finishIntersection.features
            });
        }
    });
    return events;
}

function hasFeatureId(features, featureId) {
    let foundFeatureIdInIntersection = false;
    features.forEach(feature => {
        if (feature.id === featureId)
            foundFeatureIdInIntersection = true;
    });
    return foundFeatureIdInIntersection;
}

function selectEvent(events, featureId, startIndex, direction) {
    log.debug('====> finding event for featureId: ' + featureId + ' at index: ' + startIndex);
    for (let index = startIndex + direction;
        index < events.length && index >= 0;
        index += direction) {
        log.debug('======> index: ' + index);
        log.debug(events[index]);
        log.debug(featureId);
        if (events[index].featureId === featureId) {
            log.debug('found matching event');
            log.debug(JSON.stringify(events[index], null, 2));
            return events[index];
        }

        if (!hasFeatureId(events[index].features, featureId)) {
            log.debug('found disqualifying stopping event');
            log.debug(JSON.stringify(events[index], null, 2));
            return null;
        }
    }
    return null;
}

function intersectVisits(currentVisits, intersection) {
    log.debug('========================>')
    log.debug('=> processing intersection:');
    log.debug(intersection);
    log.debug('=> currentVisits: ');
    log.debug(currentVisits);

    let events = visitsToEvents(currentVisits);
    events.sort((a,b) => {
        return a.timestamp - b.timestamp;
    });

    log.debug('=> events:');
    log.debug(events);

    let startIndex = 0;
    while (startIndex < events.length && events[startIndex].timestamp < intersection.timestamp)
        startIndex += 1;

    // if we already have an event at this timestamp, we have already handled it, so NOP.
    if (events[startIndex.timestamp] === intersection.timestamp)
        return currentVisits;

    let newVisits = JSON.parse(JSON.stringify(currentVisits));

    // perform pre-extending, extending, and new visits on all featureIds in intersection
    intersection.features.forEach(feature => {
        log.debug('==> looking at intersection featureId: ' + feature.id);
        let beforeEvent = selectEvent(events, feature.id, startIndex, -1);
        if (beforeEvent) {
            let beforeVisit = newVisits[beforeEvent.visitId];
            if (beforeVisit.finish < intersection.timestamp) {
                log.debug('====> preextending existing:');
                log.debug(JSON.stringify(beforeVisit, null, 2));
                beforeVisit.finish = intersection.timestamp;
                beforeVisit.finishIntersection = intersection;
            }
        } else {
            let afterEvent = selectEvent(events, feature.id, startIndex, 1);
            if (afterEvent) {
                let afterVisit = newVisits[afterEvent.visitId];
                if (afterVisit.start > intersection.timestamp) {
                    log.debug('====> extending existing:');
                    log.debug(JSON.stringify(afterVisit, null, 2));
                    afterVisit.start = intersection.timestamp;
                    afterVisit.startIntersection = intersection;
                }
            } else {
                // look for visits that span the intersection
                // if it spans, but both start and finish don't have the feature, split the visit.

                Object.keys(newVisits).forEach(visitId => {
                    log.debug('====> processing visit id: ' + visitId);
                    let visit = newVisits[visitId];
                    log.debug('====> processing visit: ' + JSON.stringify(visit, null, 2));
                    if (visit.start < intersection.timestamp && visit.finish > intersection.timestamp) {
                        log.debug('====> found spanning visit: ');
                        log.debug(JSON.stringify(visit, null, 2));
                        log.debug('visit featureId: ' + visit.featureId);
                        log.debug('intersection features: ' + JSON.stringify(intersection.features, null, 2));
                        if (!hasFeatureId(intersection.features, visit.featureId)) {
                            log.debug('====> intersection doesnt have visit featureId, splitting visit.');

                            // we will add the current intersection as a visit after this split below.

                            let postIntersectionVisit = {
                                id: uuid(),
                                featureId: visit.featureId,
                                start: intersection.timestamp,
                                startIntersection: intersection,
                                finish: visit.finish,
                                finishIntersection: visit.finishIntersection
                            };

                            newVisits[postIntersectionVisit.id] = postIntersectionVisit;

                            visit.finish = intersection.timestamp;
                            visit.finishIntersection = intersection;
                            log.debug(JSON.stringify(newVisits, null, 2));
                        }
                    }
                });

                let newVisit = {
                    id:        uuid(),
                    userId:    intersection.userId,
                    featureId: feature.id,
                    start:     intersection.timestamp,
                    startIntersection: intersection,
                    finish:    intersection.timestamp,
                    finishIntersection: intersection
                };
                log.debug('====> creating new visit:');
                log.debug(JSON.stringify(newVisit, null, 2));
                newVisits[newVisit.id] = newVisit;
            }
        }
    });

    log.debug('=> updated visits:');
    log.debug(JSON.stringify(newVisits, null, 2));

    log.debug('<========================');
    return newVisits;
}

function updateVisitsFromIntersection(intersection, callback) {
    async.parallel([
        callback => { getByTimestamp(intersection.userId, intersection.timestamp, callback); },
        callback => { getLastBeforeTimestamp(intersection.userId, intersection.timestamp, callback); },
        callback => { getNextAfterTimestamp(intersection.userId, intersection.timestamp, callback); }
    ], (err, results) => {
        if (err) return callback(err);

        let visits = {};

        log.debug('results:');
        log.debug(JSON.stringify(results, null, 2));

        results.forEach(result => {
            result.forEach(visit => {
                visits[visit.id] = visit;
            });
        });

        log.debug('visits:');
        log.debug(JSON.stringify(visits, null, 2));

        let newVisits = intersectVisits(visits, intersection);
        let newVisitsArray = Object.keys(newVisits).map(visitId => {
            return newVisits[visitId];
        });
        upsert(newVisitsArray, callback);
    });
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
        let upsertQuery = `INSERT INTO visits (
            id, user_id, feature_id, start, start_intersection, finish, finish_intersection, created_at, updated_at
        ) VALUES (
            '${visit.id}',
            '${visit.userId}',
            '${visit.featureId}',
            ${visit.start},
            '${JSON.stringify(visit.startIntersection)}',
            ${visit.start},
            '${JSON.stringify(visit.finishIntersection)}',
            current_timestamp,
            current_timestamp
        ) ON CONFLICT (id) DO UPDATE SET
            user_id  = '${visit.userId}',
            feature_id = '${visit.featureId}',
            start = ${visit.start},
            start_intersection = '${JSON.stringify(visit.startIntersection)}',
            finish = ${visit.finish},
            finish_intersection = '${JSON.stringify(visit.finishIntersection)}',
            updated_at = current_timestamp
        ;`;

        executeQuery(upsertQuery, visitCallback);
    }, callback);

}

module.exports = {
    fromJson:                       fromJson,
    getByTimestamp:                 getByTimestamp,
    getLastBeforeTimestamp:         getLastBeforeTimestamp,
    getNextAfterTimestamp:          getNextAfterTimestamp,
    getVisits:                      getVisits,
    init:                           init,
    intersectVisits:                intersectVisits,
    updateVisitsFromIntersection:   updateVisitsFromIntersection,
    upsert:                         upsert,
};
