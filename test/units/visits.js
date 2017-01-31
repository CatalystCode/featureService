"use strict"

let app = require('../../server'),
    assert = require('assert'),
    common = require('service-utils'),
    fixtures = require('../fixtures'),
    services = require('../../services');

function runIntersections(existingVisits, intersections, callback) {
    services.visits.setupFixtures(existingVisits, err => {
        if (err) return callback(err);

        services.visits.updateVisitsFromIntersections(intersections, err => {
            if (err) return callback(err);

            services.visits.getVisitsByUserId("user1", (err, visits) => {
                if (err) return callback(err);

                visits.sort((a,b) => {
                    if (a.start - b.start !== 0) return a.start - b.start;
                    if (a.featureId < b.featureId) return -1;
                    if (a.featureId > b.featureId) return 1;
                    return 0;
                });

                return callback(null, visits);
            });
        });
    });
}

describe('visits service', function() {
    it('can upsert visit', function(done) {
        services.visits.upsert([ fixtures.visit ], err => {
            assert(!err);
            done();
        });
    });

    it('create first visit test case', function(done) {
        let existingVisits = [];

        let intersections = [{
            userId: 'user1',
            features: [
                { id: 'CA' },
                { id: 'SC' }
            ],
            timestamp: 2
        }];

        runIntersections(existingVisits, intersections, (err, newVisits) => {
            assert(!err);

            assert(newVisits);
            assert.equal(newVisits.length, 2);

            assert.equal(newVisits[0].userId, 'user1');
            assert.equal(newVisits[0].start, 2);
            assert.equal(newVisits[0].finish, 2);
            assert.equal(newVisits[0].featureId, 'CA');
            assert.equal(JSON.stringify(newVisits[0].startIntersection), JSON.stringify(intersections[0]));
            assert.equal(JSON.stringify(newVisits[0].finishIntersection), JSON.stringify(intersections[0]));

            assert.equal(newVisits[1].userId, 'user1');
            assert.equal(newVisits[1].start, 2);
            assert.equal(newVisits[1].finish, 2);
            assert.equal(newVisits[1].featureId, 'SC');
            assert.equal(JSON.stringify(newVisits[1].startIntersection), JSON.stringify(intersections[0]));
            assert.equal(JSON.stringify(newVisits[1].finishIntersection), JSON.stringify(intersections[0]));

            done();
        });
    });

    it('extend visit test case', function(done) {
        let existingVisits = [{
            "id": "d12aaf55-8b97-49b0-9bcf-5228efd5b483",
            "userId": "user1",
            "featureId": "CA",
            "start": 2,
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "CA"
                },
                {
                "id": "SC"
                }
            ],
            "timestamp": 2
            },
            "finish": 2,
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "CA"
                },
                {
                "id": "SC"
                }
            ],
            "timestamp": 2
            }
        }, {
            "id": "6c0bf206-ee51-4266-b967-5544bb236a79",
            "userId": "user1",
            "featureId": "SC",
            "start": 2,
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "CA"
                },
                {
                "id": "SC"
                }
            ],
            "timestamp": 2
            },
            "finish": 2,
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "CA"
                },
                {
                "id": "SC"
                }
            ],
            "timestamp": 2
            }
        }];

        let intersections = [{
            userId: 'user1',
            features: [
                { id: 'CA' },
                { id: 'AP' }
            ],
            timestamp: 5
        }];

        runIntersections(existingVisits, intersections, (err, newVisits) => {
            assert(!err);

            assert(newVisits);
            assert.equal(newVisits.length, 3);

            assert.equal(newVisits[0].start, 2);
            assert.equal(newVisits[0].finish, 5);
            assert.equal(newVisits[0].featureId, 'CA');

            assert.equal(newVisits[1].start, 2);
            assert.equal(newVisits[1].finish, 2);
            assert.equal(newVisits[1].featureId, 'SC');

            assert.equal(newVisits[2].start, 5);
            assert.equal(newVisits[2].finish, 5);
            assert.equal(newVisits[2].featureId, 'AP');

            done();
        });
    });

    it('extends with aftervisit', function(done) {
        let existingVisits = [{
            "id": "d12aaf55-8b97-49b0-9bcf-5228efd5b483",
            "userId": "user1",
            "featureId": "CA",
            "start": 2,
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "CA"
                },
                {
                "id": "SC"
                }
            ],
            "timestamp": 2
            },
            "finish": 5,
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "CA"
                },
                {
                "id": "AP"
                }
            ],
            "timestamp": 5
            }
        }, {
            "id": "6c0bf206-ee51-4266-b967-5544bb236a79",
            "userId": "user1",
            "featureId": "SC",
            "start": 2,
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "CA"
                },
                {
                "id": "SC"
                }
            ],
            "timestamp": 2
            },
            "finish": 2,
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "CA"
                },
                {
                "id": "SC"
                }
            ],
            "timestamp": 2
            }
        }, {
            "id": "846df10c-46c0-42db-b150-80a8c3cf4d1d",
            "userId": "user1",
            "featureId": "AP",
            "start": 5,
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "CA"
                },
                {
                "id": "AP"
                }
            ],
            "timestamp": 5
            },
            "finish": 5,
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "CA"
                },
                {
                "id": "AP"
                }
            ],
            "timestamp": 5
            }
        }];

        let intersections = [{
            userId: 'user1',
            features: [
                { id: 'CA' },
                { id: 'SC' }
            ],
            timestamp: 1
        }];

        runIntersections(existingVisits, intersections, (err, newVisits) => {
            assert(!err);
            assert(newVisits);
            assert.equal(newVisits.length, 3);

            assert.equal(newVisits[0].start, 1);
            assert.equal(newVisits[0].finish, 5);
            assert.equal(newVisits[0].featureId, 'CA');

            assert.equal(newVisits[1].start, 1);
            assert.equal(newVisits[1].finish, 2);
            assert.equal(newVisits[1].featureId, 'SC');

            assert.equal(newVisits[2].start, 5);
            assert.equal(newVisits[2].finish, 5);
            assert.equal(newVisits[2].featureId, 'AP');

            done();
        });
    });

    it('extends with beforevisit', function(done) {
        let existingVisits = [{
            "id": "d12aaf55-8b97-49b0-9bcf-5228efd5b483",
            "userId": "user1",
            "featureId": "CA",
            "start": 1,
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "CA"
                },
                {
                "id": "SC"
                }
            ],
            "timestamp": 1
            },
            "finish": 5,
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "CA"
                },
                {
                "id": "AP"
                }
            ],
            "timestamp": 5
            }
        }, {
            "id": "6c0bf206-ee51-4266-b967-5544bb236a79",
            "userId": "user1",
            "featureId": "SC",
            "start": 1,
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "CA"
                },
                {
                "id": "SC"
                }
            ],
            "timestamp": 1
            },
            "finish": 2,
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "CA"
                },
                {
                "id": "SC"
                }
            ],
            "timestamp": 2
            }
        }, {
            "id": "846df10c-46c0-42db-b150-80a8c3cf4d1d",
            "userId": "user1",
            "featureId": "AP",
            "start": 5,
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "CA"
                },
                {
                "id": "AP"
                }
            ],
            "timestamp": 5
            },
            "finish": 5,
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "CA"
                },
                {
                "id": "AP"
                }
            ],
            "timestamp": 5
            }
        }];

        let intersections = [{
            userId: 'user1',
            features: [
                { id: 'CA' },
                { id: 'AP' }
            ],
            timestamp: 3
        }];

        runIntersections(existingVisits, intersections, (err, newVisits) => {
            assert(!err);
            assert(newVisits);
            assert.equal(newVisits.length, 3);

            assert.equal(newVisits[0].start, 1);
            assert.equal(newVisits[0].finish, 5);
            assert.equal(newVisits[0].featureId, 'CA');

            assert.equal(newVisits[1].start, 1);
            assert.equal(newVisits[1].finish, 2);
            assert.equal(newVisits[1].featureId, 'SC');

            assert.equal(newVisits[2].start, 3);
            assert.equal(newVisits[2].finish, 5);
            assert.equal(newVisits[2].featureId, 'AP');

            done();
        });
    });

    it('splits with visit spanning intersection check', function(done) {
        let existingVisits = [{
            "id": "d12aaf55-8b97-49b0-9bcf-5228efd5b483",
            "userId": "user1",
            "featureId": "CA",
            "start": 1,
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "CA"
                },
                {
                "id": "SC"
                }
            ],
            "timestamp": 1
            },
            "finish": 5,
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "CA"
                },
                {
                "id": "AP"
                }
            ],
            "timestamp": 5
            }
        }, {
            "id": "6c0bf206-ee51-4266-b967-5544bb236a79",
            "userId": "user1",
            "featureId": "SC",
            "start": 1,
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "CA"
                },
                {
                "id": "SC"
                }
            ],
            "timestamp": 1
            },
            "finish": 2,
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "CA"
                },
                {
                "id": "SC"
                }
            ],
            "timestamp": 2
            }
        }, {
            "id": "846df10c-46c0-42db-b150-80a8c3cf4d1d",
            "userId": "user1",
            "featureId": "AP",
            "start": 3,
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "CA"
                },
                {
                "id": "AP"
                }
            ],
            "timestamp": 3
            },
            "finish": 5,
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "CA"
                },
                {
                "id": "AP"
                }
            ],
            "timestamp": 5
            }
        }];

        let intersections = [{
            userId: 'user1',
            features: [
                { id: 'CA' },
                { id: 'SC' }
            ],
            timestamp: 4
        }];

        runIntersections(existingVisits, intersections, (err, newVisits) => {
            assert(!err);
            assert(newVisits);

            assert.equal(newVisits.length, 5);

            assert.equal(newVisits[2].start, 3);
            assert.equal(newVisits[2].finish, 4);
            assert.equal(newVisits[2].featureId, 'AP');

            assert.equal(newVisits[3].start, 4);
            assert.equal(newVisits[3].finish, 5);
            assert.equal(newVisits[3].featureId, 'AP');

            assert.equal(newVisits[4].start, 4);
            assert.equal(newVisits[4].finish, 4);
            assert.equal(newVisits[4].featureId, 'SC');

            done();
        });
    });

    it('applying the same intersection twice is a nop', function(done) {
        let existingVisits = [{
            "id": "d12aaf55-8b97-49b0-9bcf-5228efd5b483",
            "userId": "user1",
            "featureId": "CA",
            "start": 1,
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "CA"
                },
                {
                "id": "SC"
                }
            ],
            "timestamp": 1
            },
            "finish": 5,
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "CA"
                },
                {
                "id": "AP"
                }
            ],
            "timestamp": 5
            }
        }, {
            "id": "6c0bf206-ee51-4266-b967-5544bb236a79",
            "userId": "user1",
            "featureId": "SC",
            "start": 1,
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "CA"
                },
                {
                "id": "SC"
                }
            ],
            "timestamp": 1
            },
            "finish": 2,
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "CA"
                },
                {
                "id": "SC"
                }
            ],
            "timestamp": 2
            }
        }, {
            "id": "846df10c-46c0-42db-b150-80a8c3cf4d1d",
            "userId": "user1",
            "featureId": "AP",
            "start": 3,
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "CA"
                },
                {
                "id": "AP"
                }
            ],
            "timestamp": 3
            },
            "finish": 5,
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "CA"
                },
                {
                "id": "AP"
                }
            ],
            "timestamp": 5
            }
        }];

        let intersections = [{
            userId: 'user1',
            features: [
                { id: 'CA' },
                { id: 'AP' }
            ],
            timestamp: 3
        }];

        runIntersections(existingVisits, intersections, (err, newVisits) => {
            assert(!err);
            assert(newVisits);
            assert.equal(newVisits.length, existingVisits.length);

            done();
        });
    });

    it('applying an intersection that is covered by a spanning visit is a nop', function(done) {
        let existingVisits = [{
            "id": "846df10c-46c0-42db-b150-80a8c3cf4d1d",
            "userId": "user1",
            "featureId": "AP",
            "start": 3,
            "startIntersection": {
                "userId": "user1",
                "features": [
                    {
                    "id": "CA"
                    },
                    {
                    "id": "AP"
                    }
                ],
                "timestamp": 3
            },
            "finish": 5,
            "finishIntersection": {
                "userId": "user1",
                "features": [
                    {
                    "id": "CA"
                    },
                    {
                    "id": "AP"
                    }
                ],
                "timestamp": 5
            }
        }];

        let intersections = [{
            userId: 'user1',
            features: [
                { id: 'AP' }
            ],
            timestamp: 4
        }];

        runIntersections(existingVisits, intersections, (err, newVisits) => {
            assert(!err);
            assert(newVisits);
            assert.equal(newVisits.length, existingVisits.length);

            done();
        });
    });

    it('matching intersection timestamp and visit start / finish timestamp doesnt cause split', function(done) {
        let existingVisits = [{
            "id": "1c4f3d63-e018-4542-8dee-5a0e4acbf116",
            "start": 1477156258000,
            "finish": 1482084877000,
            "featureId": "casp-1087893243",
            "userId": "user1",
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575"
                },
                {
                "id": "wof-85633793"
                },
                {
                "id": "wof-85688637"
                },
                {
                "id": "casp-1087893243"
                }
            ],
            "timestamp": 1477156258000
            },
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575"
                },
                {
                "id": "wof-85633793"
                },
                {
                "id": "wof-85688637"
                },
                {
                "id": "casp-1087893243"
                }
            ],
            "timestamp": 1482084877000
            },
            "createdAt": "2017-01-28T02:23:06.666Z",
            "updatedAt": "2017-01-28T04:08:22.994Z"
        },
        {
            "id": "580e59d5-39d0-44fe-a992-72448c3b2ceb",
            "start": 1482086733000,
            "finish": 1482095888000,
            "featureId": "casp-1087893243",
            "userId": "user1",
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575"
                },
                {
                "id": "wof-85633793"
                },
                {
                "id": "wof-85688637"
                },
                {
                "id": "casp-1087893243"
                }
            ],
            "timestamp": 1482086733000
            },
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575"
                },
                {
                "id": "wof-85633793"
                },
                {
                "id": "wof-85688637"
                },
                {
                "id": "casp-1087893243"
                }
            ],
            "timestamp": 1482095888000
            },
            "createdAt": "2017-01-28T02:23:58.635Z",
            "updatedAt": "2017-01-28T02:27:17.464Z"
        },
        {
            "id": "b6309be9-256f-4f0f-98cc-f80ac0eadf81",
            "start": 1476571379000,
            "finish": 1484516492000,
            "featureId": "wof-102191575",
            "userId": "user1",
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575"
                },
                {
                "id": "wof-85633793"
                },
                {
                "id": "wof-85688637"
                }
            ],
            "timestamp": 1476571379000
            },
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575"
                },
                {
                "id": "wof-85633793"
                },
                {
                "id": "wof-85688637"
                }
            ],
            "timestamp": 1484516492000
            },
            "createdAt": "2017-01-28T02:06:26.262Z",
            "updatedAt": "2017-01-28T05:25:30.996Z"
        },
        {
            "id": "931a4686-60a8-4785-966d-252ff1c4214c",
            "start": 1482966053000,
            "finish": 1484516492000,
            "featureId": "wof-85688637",
            "userId": "user1",
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575"
                },
                {
                "id": "wof-85633793"
                },
                {
                "id": "wof-85688637"
                }
            ],
            "timestamp": 1482966053000
            },
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575"
                },
                {
                "id": "wof-85633793"
                },
                {
                "id": "wof-85688637"
                }
            ],
            "timestamp": 1484516492000
            },
            "createdAt": "2017-01-28T02:06:26.270Z",
            "updatedAt": "2017-01-28T03:35:04.047Z"
        },
        {
            "id": "23d175f1-8f97-4ede-b185-0ee6b67865ca",
            "start": 1482095889000,
            "finish": 1482096403000,
            "featureId": "casp-1087893243",
            "userId": "user1",
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575"
                },
                {
                "id": "wof-85633793"
                },
                {
                "id": "wof-85688637"
                },
                {
                "id": "casp-1087893243"
                }
            ],
            "timestamp": 1482095889000
            },
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575"
                },
                {
                "id": "wof-85633793"
                },
                {
                "id": "wof-85688637"
                },
                {
                "id": "casp-1087893243"
                }
            ],
            "timestamp": 1482096403000
            },
            "createdAt": "2017-01-28T02:27:17.472Z",
            "updatedAt": "2017-01-28T02:27:36.770Z"
        },
        {
            "id": "e3339f4a-74cc-4de1-a900-73724f4ccf1c",
            "start": 1482096404000,
            "finish": 1482096706000,
            "featureId": "casp-1087893243",
            "userId": "user1",
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575"
                },
                {
                "id": "wof-85633793"
                },
                {
                "id": "wof-85688637"
                },
                {
                "id": "casp-1087893243"
                }
            ],
            "timestamp": 1482096404000
            },
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575"
                },
                {
                "id": "wof-85633793"
                },
                {
                "id": "wof-85688637"
                },
                {
                "id": "casp-1087893243"
                }
            ],
            "timestamp": 1482096706000
            },
            "createdAt": "2017-01-28T02:27:36.777Z",
            "updatedAt": "2017-01-28T02:27:53.145Z"
        },
        {
            "id": "3b47faea-e4ac-43ce-ae28-30ad9ee1090e",
            "start": 1476571379000,
            "finish": 1482362040000,
            "featureId": "wof-85688637",
            "userId": "user1",
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575"
                },
                {
                "id": "wof-85633793"
                },
                {
                "id": "wof-85688637"
                }
            ],
            "timestamp": 1476571379000
            },
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575"
                },
                {
                "id": "wof-85633793"
                },
                {
                "id": "wof-85688637"
                }
            ],
            "timestamp": 1482362040000
            },
            "createdAt": "2017-01-28T02:19:49.110Z",
            "updatedAt": "2017-01-28T05:25:31.112Z"
        },
        {
            "id": "bf11f816-0b7e-401c-a0ae-5348f379a8a3",
            "start": 1476571637000,
            "finish": 1480283505000,
            "featureId": "casp-1223894223",
            "userId": "user1",
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575"
                },
                {
                "id": "wof-85633793"
                },
                {
                "id": "wof-85688637"
                },
                {
                "id": "casp-1223894223"
                }
            ],
            "timestamp": 1476571637000
            },
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575"
                },
                {
                "id": "wof-85633793"
                },
                {
                "id": "wof-85688637"
                },
                {
                "id": "casp-1223894223"
                }
            ],
            "timestamp": 1480283505000
            },
            "createdAt": "2017-01-28T03:00:05.858Z",
            "updatedAt": "2017-01-28T05:25:34.156Z"
        },
        {
            "id": "fe618fb7-5da1-4460-b916-4b56afa9b6e3",
            "start": 1476571379000,
            "finish": 1484516492000,
            "featureId": "wof-85633793",
            "userId": "user1",
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575"
                },
                {
                "id": "wof-85633793"
                },
                {
                "id": "wof-85688637"
                }
            ],
            "timestamp": 1476571379000
            },
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575"
                },
                {
                "id": "wof-85633793"
                },
                {
                "id": "wof-85688637"
                }
            ],
            "timestamp": 1484516492000
            },
            "createdAt": "2017-01-28T02:06:26.270Z",
            "updatedAt": "2017-01-28T05:25:31.205Z"
        }];

        let intersections = [{
        "features": [
            {
            "id": "wof-102191575"
            },
            {
            "id": "wof-85633793"
            },
            {
            "id": "wof-85688637"
            },
            {
            "id": "casp-1087893243"
            }
        ],
        "timestamp": 1477156258000,
        "userId": "user1"
        }];

        runIntersections(existingVisits, intersections, (err, newVisits) => {
            assert(!err);
            assert(newVisits);

            assert.equal(newVisits.length, 10);

            done();
        });
    });

/*
    it('strava issue', function(done) {
        let existingVisits = [];

        let intersections = [{
            "features": [
                {
                "id": "wof-102191575"
                },
                {
                "id": "wof-85633793"
                },
                {
                "id": "wof-85688637"
                }
            ],
            "timestamp": 1480972968000,
            "userId": "10152875766888406"
        }];

        runIntersections(existingVisits, intersections, (err, newVisits) => {
            assert(!err);
            assert(newVisits);

            //services.visits.checkVisits(newVisits);

            done();
        });
    });
*/

    it('can update visits from intersection', function(done) {
        services.visits.updateVisitsFromIntersections(fixtures.intersections, err => {
            assert(!err);
            done();
        });
    });
});
