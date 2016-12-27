"use strict"

const async = require('async'),
      azure = require('azure-storage'),
      common = require('service-utils'),
      HttpStatus = require('http-status-codes'),
      pg = require('pg'),
      process = require('process'),
      Redlock = require('redlock'),
      ServiceError = common.utils.ServiceError,
      url = require('url'),
      uuid = require('uuid/v4');

let featureTablePool;
let redlock;

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

    row['start'] = parseInt(row['start']);
    row['finish'] = parseInt(row['finish']);

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

function getByTimestamp(userId, timestamp, callback) {
    executeQuery(`SELECT * FROM visits WHERE user_id='${userId}' AND start >= ${timestamp} AND finish <= ${timestamp}`, callback);
}

function getLastBeforeTimestamp(userId, timestamp, callback) {
    executeQuery(`SELECT * FROM visits WHERE user_id='${userId}' AND finish < ${timestamp} ORDER BY finish DESC LIMIT 100`, callback);
}

function getNextAfterTimestamp(userId, timestamp, callback) {
    executeQuery(`SELECT * FROM visits WHERE user_id='${userId}' AND start > ${timestamp} ORDER BY start ASC LIMIT 100`, callback);
}

function getVisits(userId, options, callback) {
    let query = `SELECT * FROM visits WHERE user_id='${userId}'`;
    executeQuery(query, callback);
}

function init(callback) {
    if (!process.env.FEATURES_CONNECTION_STRING)
        return callback(new ServiceError(HttpStatus.INTERNAL_SERVER_ERROR, "FEATURES_CONNECTION_STRING configuration not provided as environment variable"));

    if (!process.env.REDIS_HOST)
        return callback(new ServiceError(HttpStatus.INTERNAL_SERVER_ERROR, "REDIS_HOST configuration not provided as environment variable"));

    if (!process.env.REDIS_KEY)
        return callback(new ServiceError(HttpStatus.INTERNAL_SERVER_ERROR, "REDIS_KEY configuration not provided as environment variable"));

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

    let client = require('redis').createClient(6380, process.env.REDIS_HOST, {
        auth_pass: process.env.REDIS_KEY,
        tls: {
            servername: process.env.REDIS_HOST
        }
    });

    var Redlock = require('redlock');

    redlock = new Redlock(
        [client],
        {
            driftFactor: 0.01,  // ms
            retryCount: 100,
            retryDelay: 125     // ms
        }
    );

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
    //log.info('====> finding event for featureId: ' + featureId + ' at index: ' + startIndex);
    for (let index = startIndex + direction;
        index < events.length && index >= 0;
        index += direction) {
        //log.info('======> index: ' + index);
        //log.info(JSON.stringify(events[index], null, 2));
        //log.info(featureId);
        if (events[index].featureId === featureId) {
            //log.info('found matching event');
            //log.info(JSON.stringify(events[index], null, 2));
            return events[index];
        }

        if (!hasFeatureId(events[index].features, featureId)) {
            //log.info('found disqualifying stopping event');
            //log.info(JSON.stringify(events[index], null, 2));
            return null;
        }
    }
    return null;
}

//let names = {};

function intersectVisits(currentVisits, intersection) {
    //intersection.features.forEach(feature => {
    //    names[feature.id] = feature.names.common;
    //});

    //log.info('========================>')
    //common.services.log.info('=> currentVisits: ');
    //common.services.log.info(JSON.stringify(currentVisits, null, 2));
    //common.services.log.info('=> processing intersection:');
    //common.services.log.info(JSON.stringify(intersection, null, 2));

    //common.services.log.info('intersection @ ' + moment(intersection.timestamp).format(dateFormatString));

    let events = visitsToEvents(currentVisits);
    events.sort((a,b) => {
        return a.timestamp - b.timestamp;
    });

    /*
    console.log('=> events:');
    let index = 0;
    events.forEach(event => {
        let eventString = `${index}: ${event.featureId}: `;
        event.features.forEach(feature => {
            eventString += `${feature.id},`;
        });
        index += 1;
        console.log(eventString);
    });
    */

    let startIndex = 0;
    while (startIndex < events.length && events[startIndex].timestamp < intersection.timestamp)
        startIndex += 1;

    //console.log('=> startIndex:' + startIndex);

    // if we already have an event at this timestamp, we have already handled it, so NOP.
    if (events[startIndex.timestamp] === intersection.timestamp) {
        //console.log('already handled.');
        return currentVisits;
    }

    let newVisits = JSON.parse(JSON.stringify(currentVisits));

    // perform pre-extending, extending, and new visits on all featureIds in intersection
    intersection.features.forEach(feature => {
        //common.services.log.info('==> looking at intersection featureId: ' + feature.id);
        let beforeEvent = selectEvent(events, feature.id, startIndex, -1);
        if (beforeEvent) {
            let beforeVisit = newVisits[beforeEvent.visitId];
            if (beforeVisit.finish < intersection.timestamp) {
                beforeVisit.finish = intersection.timestamp;
                beforeVisit.finishIntersection = intersection;
                beforeVisit.touched = intersection.timestamp;
                //common.services.log.info('====> adjusting visit ' + beforeVisit.id + ' before intersection to end on intersection ' + feature.id);
                //common.services.log.info(JSON.stringify(beforeVisit, null, 2));
            } else {
                //common.services.log.info('====> before visit spans this intersection: ' + beforeVisit.id);
            }
        } else {
            let afterEvent = selectEvent(events, feature.id, startIndex, 1);
            if (afterEvent) {
                let afterVisit = newVisits[afterEvent.visitId];
                if (afterVisit.start > intersection.timestamp) {
                    afterVisit.start = intersection.timestamp;
                    afterVisit.startIntersection = intersection;
                    afterVisit.touched = intersection.timestamp;
                    //common.services.log.info('====> adjusting visit ' + afterVisit.id + ' after intersection to start on intersection for ' + feature.id);
                    //common.services.log.info(JSON.stringify(afterVisit, null, 2));
                } else {
                    //common.services.log.info('====> after visit spans this intersection: ' + afterVisit.id);
                }
            } else {
                // look for visits that span the intersection
                // if it spans, but both start and finish don't have the feature, split the visit.

                // make sure that at most one visit is created that contains intersection.
                let featureHandled = false;
                Object.keys(newVisits).forEach(visitId => {
                    //log.info('====> processing visit id: ' + visitId);
                    let visit = newVisits[visitId];
                    //log.info('====> processing visit: ' + JSON.stringify(visit, null, 2));
                    if (visit.start < intersection.timestamp && visit.finish > intersection.timestamp) {
                        //common.services.log.info('====> found spanning visit: ' + visit.id);

                        if (!hasFeatureId(intersection.features, visit.featureId)) {
                            //common.services.log.info('====> visit doesnt have any of the intersection featureIds, splitting visit: ' + visit.id);

                            let postIntersectionVisit = {
                                id: uuid(),
                                userId: intersection.userId,
                                featureId: visit.featureId,
                                start: intersection.timestamp,
                                startIntersection: intersection,
                                finish: visit.finish,
                                finishIntersection: visit.finishIntersection,
                                touched: intersection.timestamp
                            };
                            newVisits[postIntersectionVisit.id] = postIntersectionVisit;

                            visit.finish = intersection.timestamp;
                            visit.finishIntersection = intersection;
                            visit.touched = intersection.timestamp;
                        } else if (visit.featureId === feature.id) {
                            //common.services.log.info('visit has featureId so we shouldnt need to create a new visit.');
                            featureHandled = true;
                        }
                    }
                });

                if (!featureHandled) {
                    let newVisit = {
                        id:        uuid(),
                        userId:    intersection.userId,
                        featureId: feature.id,
                        start:     intersection.timestamp,
                        startIntersection: intersection,
                        finish:    intersection.timestamp,
                        finishIntersection: intersection,
                        touched:   intersection.timestamp
                    };

                    //common.services.log.info('====> creating new visit for ' + feature.id);
                    //common.services.log.info(JSON.stringify(newVisit, null, 2));
                    newVisits[newVisit.id] = newVisit;
                }
            }
        }
    });

    //common.services.log.info('=> updated visits:');
    //common.services.log.info(JSON.stringify(newVisits, null, 2));

    //log.info('<========================');
    return newVisits;
}

let moment = require('moment');
let dateFormatString = 'YYYY-MM-DD HH:mm:ss';

function displayVisits(callback) {
    getVisits('10152875766888406', {}, (err, visits) => {
        if (err && callback) return callback(err);
        let visitDisplay = [];

        visits.sort((a,b) => {
            if (a.featureId < b.featureId)
                return -1;
            if (a.featureId > b.featureId)
                return 1;

            return a.start - b.start;
        });

        let previousVisit;
        visits.forEach(visit => {
            let startDate = new Date(visit.start);
            let formattedStartDate = moment(startDate).format(dateFormatString);
            let finishDate = new Date(visit.finish);
            let formattedFinishDate = moment(finishDate).format(dateFormatString);
            //let derefedFeatureId = names[visit.featureId];
            //let formattedFeatureId = derefedFeatureId;jj

            /*
            console.log(`${derefedFeatureId}: ${formattedStartDate} => ${formattedFinishDate}: ${visit.id}`);
            if (previousVisit) {
                if (visit.id === previousVisit.id && visit.start < previousVisit.finish) {
                    console.log('ERROR: OVERLAP!!');
                }
            }
            */

            previousVisit = visit;
        });

        if (callback) return callback();
    });
}

function updateVisitsFromIntersections(intersections, callback) {

    // TODO: Revive tighter bound on the visits we actually need.
    // async.parallel([
    //    callback => { getByTimestamp(intersection.userId, intersection.timestamp, callback); },
    //    callback => { getLastBeforeTimestamp(intersection.userId, intersection.timestamp, callback); },
    //    callback => { getNextAfterTimestamp(intersection.userId, intersection.timestamp, callback); }
    // ], (err, results) => {

    if (intersections.length === 0) return callback();

    let userId = intersections[0].userId;
    let resource = 'userVisits:' + userId;
    let ttl = 5000;

    redlock.lock(resource, ttl, (err, lock) => {
        if (err) return callback(err);

        //common.services.log.info('starting updateVisitsFromIntersection');

        getVisits(userId, {}, (err, visitList) => {
            if (err) return callback(err);

            let visits = {};

            //log.info('results:');
            //log.info(JSON.stringify(results, null, 2));

            visitList.forEach(visit => {
                visits[visit.id] = visit;
            });

            intersections.forEach(intersection => {
                visits = intersectVisits(visits, intersection);
            });

            let newVisitList = Object.keys(visits).map(visitId => {
                return visits[visitId];
            });

            upsert(newVisitList, err => {
                //common.services.log.info('finished updateVisitsFromIntersection');
                lock.unlock(lockErr => {
                    if (lockErr) common.services.log.error(lockErr);

                    displayVisits(callback);
                });
            });
        });
    });

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
            id, user_id, feature_id, start, start_intersection, finish, finish_intersection, created_at, updated_at
        ) VALUES (
            '${visit.id}',
            '${visit.userId}',
            '${visit.featureId}',
            ${visit.start},
            '${JSON.stringify(visit.startIntersection).replace(/'/g,"''")}',
            ${visit.start},
            '${JSON.stringify(visit.finishIntersection).replace(/'/g,"''")}',
            current_timestamp,
            current_timestamp
        ) ON CONFLICT (id) DO UPDATE SET
            user_id  = '${visit.userId}',
            feature_id = '${visit.featureId}',
            start = ${visit.start},
            start_intersection = '${JSON.stringify(visit.startIntersection).replace(/'/g,"''")}',
            finish = ${visit.finish},
            finish_intersection = '${JSON.stringify(visit.finishIntersection).replace(/'/g,"''")}',
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
    updateVisitsFromIntersections:  updateVisitsFromIntersections,
    upsert:                         upsert,
};
