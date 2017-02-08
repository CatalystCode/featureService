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

                return callback(services.visits.checkVisits(visits), visits);
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

            assert.equal(newVisits.length, 9);

            done();
        });
    });

    it('handles events with the same feature id and timestamp correctly by sorting them', function(done) {
        let existingVisits = [
        {
            "id": "ce24a567-456e-4dbe-946c-fcfc52f1c56e",
            "start": 1474821826000,
            "finish": 1485650495000,
            "featureId": "wof-85633793",
            "userId": "user1",
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575",
                "name": "North America",
                "layer": "continent"
                },
                {
                "id": "wof-85633793",
                "name": "United States",
                "layer": "country"
                },
                {
                "id": "wof-85688637",
                "name": "California",
                "layer": "region"
                },
                {
                "id": "usnf-1825117944",
                "name": "Tahoe National Forest",
                "layer": "park"
                }
            ],
            "timestamp": 1474821826000
            },
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575",
                "name": "North America",
                "layer": "continent"
                },
                {
                "id": "wof-85633793",
                "name": "United States",
                "layer": "country"
                },
                {
                "id": "wof-85688637",
                "name": "California",
                "layer": "region"
                },
                {
                "id": "usnf-1825117944",
                "name": "Tahoe National Forest",
                "layer": "park"
                }
            ],
            "timestamp": 1485650495000
            },
            "createdAt": "2017-02-07T06:06:31.844Z",
            "updatedAt": "2017-02-07T07:43:53.368Z"
        },
        {
            "id": "03cf1ca9-d12d-487b-8770-6fac6a8c3a2f",
            "start": 1474821826000,
            "finish": 1485650495000,
            "featureId": "wof-102191575",
            "userId": "user1",
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575",
                "name": "North America",
                "layer": "continent"
                },
                {
                "id": "wof-85633793",
                "name": "United States",
                "layer": "country"
                },
                {
                "id": "wof-85688637",
                "name": "California",
                "layer": "region"
                },
                {
                "id": "usnf-1825117944",
                "name": "Tahoe National Forest",
                "layer": "park"
                }
            ],
            "timestamp": 1474821826000
            },
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575",
                "name": "North America",
                "layer": "continent"
                },
                {
                "id": "wof-85633793",
                "name": "United States",
                "layer": "country"
                },
                {
                "id": "wof-85688637",
                "name": "California",
                "layer": "region"
                },
                {
                "id": "usnf-1825117944",
                "name": "Tahoe National Forest",
                "layer": "park"
                }
            ],
            "timestamp": 1485650495000
            },
            "createdAt": "2017-02-07T06:06:31.750Z",
            "updatedAt": "2017-02-07T07:43:53.463Z"
        },
        {
            "id": "d9e07b40-8f34-4060-9c9b-bfb8296f71b2",
            "start": 1474821826000,
            "finish": 1482758862000,
            "featureId": "wof-85688637",
            "userId": "user1",
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575",
                "name": "North America",
                "layer": "continent"
                },
                {
                "id": "wof-85633793",
                "name": "United States",
                "layer": "country"
                },
                {
                "id": "wof-85688637",
                "name": "California",
                "layer": "region"
                },
                {
                "id": "usnf-1825117944",
                "name": "Tahoe National Forest",
                "layer": "park"
                }
            ],
            "timestamp": 1474821826000
            },
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575",
                "name": "North America",
                "layer": "continent"
                },
                {
                "id": "wof-85633793",
                "name": "United States",
                "layer": "country"
                },
                {
                "id": "wof-85688599",
                "name": "Michigan",
                "layer": "region"
                }
            ],
            "timestamp": 1482758862000
            },
            "createdAt": "2017-02-07T06:06:31.930Z",
            "updatedAt": "2017-02-07T07:43:53.553Z"
        },
        {
            "id": "1377b9ad-8d53-4297-8491-ec5cbec48ae2",
            "start": 1475344781000,
            "finish": 1477155241000,
            "featureId": "casp-1087893243",
            "userId": "user1",
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575",
                "name": "North America",
                "layer": "continent"
                },
                {
                "id": "wof-85633793",
                "name": "United States",
                "layer": "country"
                },
                {
                "id": "wof-85688637",
                "name": "California",
                "layer": "region"
                },
                {
                "id": "casp-1087893243",
                "name": "Wilder Ranch SP",
                "layer": "park"
                }
            ],
            "timestamp": 1475344781000
            },
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575",
                "name": "North America",
                "layer": "continent"
                },
                {
                "id": "wof-85633793",
                "name": "United States",
                "layer": "country"
                },
                {
                "id": "wof-85688637",
                "name": "California",
                "layer": "region"
                },
                {
                "id": "casp-2916694474",
                "name": "Lighthouse Field SB",
                "layer": "park"
                }
            ],
            "timestamp": 1477155241000
            },
            "createdAt": "2017-02-07T06:11:39.313Z",
            "updatedAt": "2017-02-07T07:43:53.640Z"
        },
        {
            "id": "df84c5f1-7c4d-42c8-9c91-412161e67828",
            "start": 1477155241000,
            "finish": 1477155713000,
            "featureId": "casp-1087893243",
            "userId": "user1",
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575",
                "name": "North America",
                "layer": "continent"
                },
                {
                "id": "wof-85633793",
                "name": "United States",
                "layer": "country"
                },
                {
                "id": "wof-85688637",
                "name": "California",
                "layer": "region"
                },
                {
                "id": "casp-2916694474",
                "name": "Lighthouse Field SB",
                "layer": "park"
                }
            ],
            "timestamp": 1477155241000
            },
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575",
                "name": "North America",
                "layer": "continent"
                },
                {
                "id": "wof-85633793",
                "name": "United States",
                "layer": "country"
                },
                {
                "id": "wof-85688637",
                "name": "California",
                "layer": "region"
                },
                {
                "id": "casp-2527187433",
                "name": "Natural Bridges SB",
                "layer": "park"
                }
            ],
            "timestamp": 1477155713000
            },
            "createdAt": "2017-02-07T06:56:09.195Z",
            "updatedAt": "2017-02-07T07:43:53.642Z"
        },
        {
            "id": "54ef5a32-327c-4332-b475-bb3aa8524537",
            "start": 1477155713000,
            "finish": 1477155761000,
            "featureId": "casp-1087893243",
            "userId": "user1",
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575",
                "name": "North America",
                "layer": "continent"
                },
                {
                "id": "wof-85633793",
                "name": "United States",
                "layer": "country"
                },
                {
                "id": "wof-85688637",
                "name": "California",
                "layer": "region"
                },
                {
                "id": "casp-2527187433",
                "name": "Natural Bridges SB",
                "layer": "park"
                }
            ],
            "timestamp": 1477155713000
            },
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575",
                "name": "North America",
                "layer": "continent"
                },
                {
                "id": "wof-85633793",
                "name": "United States",
                "layer": "country"
                },
                {
                "id": "wof-85688637",
                "name": "California",
                "layer": "region"
                },
                {
                "id": "casp-2527187433",
                "name": "Natural Bridges SB",
                "layer": "park"
                },
                {
                "id": "casp-263136887",
                "name": "Monarch Butterfly NP",
                "layer": "park"
                }
            ],
            "timestamp": 1477155761000
            },
            "createdAt": "2017-02-07T06:56:36.537Z",
            "updatedAt": "2017-02-07T07:43:53.642Z"
        },
        {
            "id": "fac9993e-4210-4e54-8d7f-65149b20375c",
            "start": 1477155761000,
            "finish": 1477156377000,
            "featureId": "casp-1223894223",
            "userId": "user1",
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575",
                "name": "North America",
                "layer": "continent"
                },
                {
                "id": "wof-85633793",
                "name": "United States",
                "layer": "country"
                },
                {
                "id": "wof-85688637",
                "name": "California",
                "layer": "region"
                },
                {
                "id": "casp-2527187433",
                "name": "Natural Bridges SB",
                "layer": "park"
                },
                {
                "id": "casp-263136887",
                "name": "Monarch Butterfly NP",
                "layer": "park"
                }
            ],
            "timestamp": 1477155761000
            },
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575",
                "name": "North America",
                "layer": "continent"
                },
                {
                "id": "wof-85633793",
                "name": "United States",
                "layer": "country"
                },
                {
                "id": "wof-85688637",
                "name": "California",
                "layer": "region"
                },
                {
                "id": "casp-1087893243",
                "name": "Wilder Ranch SP",
                "layer": "park"
                },
                {
                "id": "casp-4220598026",
                "name": "Wilder Dairy CP",
                "layer": "park"
                }
            ],
            "timestamp": 1477156377000
            },
            "createdAt": "2017-02-07T06:56:42.378Z",
            "updatedAt": "2017-02-07T07:43:53.646Z"
        },
        {
            "id": "4f8f6117-81b9-4c7c-a8fe-ab1d6ec31e89",
            "start": 1477155761000,
            "finish": 1482096706000,
            "featureId": "casp-1087893243",
            "userId": "user1",
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575",
                "name": "North America",
                "layer": "continent"
                },
                {
                "id": "wof-85633793",
                "name": "United States",
                "layer": "country"
                },
                {
                "id": "wof-85688637",
                "name": "California",
                "layer": "region"
                },
                {
                "id": "casp-2527187433",
                "name": "Natural Bridges SB",
                "layer": "park"
                },
                {
                "id": "casp-263136887",
                "name": "Monarch Butterfly NP",
                "layer": "park"
                }
            ],
            "timestamp": 1477155761000
            },
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575",
                "name": "North America",
                "layer": "continent"
                },
                {
                "id": "wof-85633793",
                "name": "United States",
                "layer": "country"
                },
                {
                "id": "wof-85688637",
                "name": "California",
                "layer": "region"
                },
                {
                "id": "casp-1087893243",
                "name": "Wilder Ranch SP",
                "layer": "park"
                }
            ],
            "timestamp": 1482096706000
            },
            "createdAt": "2017-02-07T06:56:42.381Z",
            "updatedAt": "2017-02-07T07:43:53.650Z"
        },
        {
            "id": "d9153a88-7f77-4347-b320-c9f7ed98c7a1",
            "start": 1477156374000,
            "finish": 1477156377000,
            "featureId": "casp-4220598026",
            "userId": "user1",
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575",
                "name": "North America",
                "layer": "continent"
                },
                {
                "id": "wof-85633793",
                "name": "United States",
                "layer": "country"
                },
                {
                "id": "wof-85688637",
                "name": "California",
                "layer": "region"
                },
                {
                "id": "casp-1087893243",
                "name": "Wilder Ranch SP",
                "layer": "park"
                },
                {
                "id": "casp-4220598026",
                "name": "Wilder Dairy CP",
                "layer": "park"
                }
            ],
            "timestamp": 1477156374000
            },
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575",
                "name": "North America",
                "layer": "continent"
                },
                {
                "id": "wof-85633793",
                "name": "United States",
                "layer": "country"
                },
                {
                "id": "wof-85688637",
                "name": "California",
                "layer": "region"
                },
                {
                "id": "casp-1087893243",
                "name": "Wilder Ranch SP",
                "layer": "park"
                },
                {
                "id": "casp-4220598026",
                "name": "Wilder Dairy CP",
                "layer": "park"
                }
            ],
            "timestamp": 1477156377000
            },
            "createdAt": "2017-02-07T07:43:53.656Z",
            "updatedAt": "2017-02-07T07:43:53.940Z"
        },
        {
            "id": "98b6bc1e-d234-46d4-a101-78ab81d9fce3",
            "start": 1477156377000,
            "finish": 1480283505000,
            "featureId": "casp-1223894223",
            "userId": "user1",
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575",
                "name": "North America",
                "layer": "continent"
                },
                {
                "id": "wof-85633793",
                "name": "United States",
                "layer": "country"
                },
                {
                "id": "wof-85688637",
                "name": "California",
                "layer": "region"
                },
                {
                "id": "casp-1087893243",
                "name": "Wilder Ranch SP",
                "layer": "park"
                },
                {
                "id": "casp-4220598026",
                "name": "Wilder Dairy CP",
                "layer": "park"
                }
            ],
            "timestamp": 1477156377000
            },
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575",
                "name": "North America",
                "layer": "continent"
                },
                {
                "id": "wof-85633793",
                "name": "United States",
                "layer": "country"
                },
                {
                "id": "wof-85688637",
                "name": "California",
                "layer": "region"
                },
                {
                "id": "casp-1223894223",
                "name": "Twin Lakes SB",
                "layer": "park"
                }
            ],
            "timestamp": 1480283505000
            },
            "createdAt": "2017-02-07T07:43:53.653Z",
            "updatedAt": "2017-02-07T07:43:53.653Z"
        },
        {
            "id": "6d855c58-a3e3-40e1-bc04-e3818b3e609a",
            "start": 1482758862000,
            "finish": 1485650495000,
            "featureId": "wof-85688637",
            "userId": "user1",
            "startIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575",
                "name": "North America",
                "layer": "continent"
                },
                {
                "id": "wof-85633793",
                "name": "United States",
                "layer": "country"
                },
                {
                "id": "wof-85688599",
                "name": "Michigan",
                "layer": "region"
                }
            ],
            "timestamp": 1482758862000
            },
            "finishIntersection": {
            "userId": "user1",
            "features": [
                {
                "id": "wof-102191575",
                "name": "North America",
                "layer": "continent"
                },
                {
                "id": "wof-85633793",
                "name": "United States",
                "layer": "country"
                },
                {
                "id": "wof-85688637",
                "name": "California",
                "layer": "region"
                },
                {
                "id": "usnf-1825117944",
                "name": "Tahoe National Forest",
                "layer": "park"
                }
            ],
            "timestamp": 1485650495000
            },
            "createdAt": "2017-02-07T06:26:53.954Z",
            "updatedAt": "2017-02-07T07:43:53.649Z"
        }];

        let intersections = [{
            "userId": "user1",
            "features": [
                {
                "id": "casp-1087893243",
                "name": "Wilder Ranch SP",
                "layer": "park"
                }
            ],
            "timestamp": 1477156337000
        }];

        runIntersections(existingVisits, intersections, (err, newVisits) => {
            assert(!err);
            assert(newVisits);

            done();
        });
    });

    it('handles event finding over spanning visit at initial search index correctly', function(done) {
        let existingVisits = [
  {
    "id": "fc00709b-ac2e-4742-8c4b-80255b18ef82",
    "start": 1466869377000,
    "finish": 1466869377000,
    "featureId": "usnf-2703867721",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688603",
          "name": "Colorado",
          "layer": "region"
        },
        {
          "id": "usnf-2703867721",
          "name": "Arapaho and Roosevelt National Forests",
          "layer": "park"
        }
      ],
      "timestamp": 1466869377000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688603",
          "name": "Colorado",
          "layer": "region"
        },
        {
          "id": "usnf-2703867721",
          "name": "Arapaho and Roosevelt National Forests",
          "layer": "park"
        }
      ],
      "timestamp": 1466869377000
    },
    "createdAt": "2017-02-07T13:38:00.045Z",
    "updatedAt": "2017-02-07T13:38:00.045Z"
  },
  {
    "id": "0de3dc3e-6c1c-4be8-a517-362324508189",
    "start": 1466875503000,
    "finish": 1466876390000,
    "featureId": "usnf-2703867721",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688603",
          "name": "Colorado",
          "layer": "region"
        },
        {
          "id": "usnf-2703867721",
          "name": "Arapaho and Roosevelt National Forests",
          "layer": "park"
        }
      ],
      "timestamp": 1466875503000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688603",
          "name": "Colorado",
          "layer": "region"
        },
        {
          "id": "usnf-2703867721",
          "name": "Arapaho and Roosevelt National Forests",
          "layer": "park"
        }
      ],
      "timestamp": 1466876390000
    },
    "createdAt": "2017-02-07T13:38:22.326Z",
    "updatedAt": "2017-02-07T13:38:26.993Z"
  },
  {
    "id": "43af7990-61fa-4b07-81e8-831bc7161f1b",
    "start": 1466876518000,
    "finish": 1466877224000,
    "featureId": "usnf-2703867721",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688603",
          "name": "Colorado",
          "layer": "region"
        },
        {
          "id": "usnf-2703867721",
          "name": "Arapaho and Roosevelt National Forests",
          "layer": "park"
        }
      ],
      "timestamp": 1466876518000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688603",
          "name": "Colorado",
          "layer": "region"
        },
        {
          "id": "usnf-2703867721",
          "name": "Arapaho and Roosevelt National Forests",
          "layer": "park"
        }
      ],
      "timestamp": 1466877224000
    },
    "createdAt": "2017-02-07T13:38:26.998Z",
    "updatedAt": "2017-02-07T13:38:26.998Z",
    "dirty": true
  },
  {
    "id": "c8c55584-ff44-4375-9ea5-eb5d3404dbef",
    "start": 1466869863000,
    "finish": 1466875500000,
    "featureId": "usnf-3429178507",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688603",
          "name": "Colorado",
          "layer": "region"
        },
        {
          "id": "usnf-3429178507",
          "name": "White River National Forest",
          "layer": "park"
        }
      ],
      "timestamp": 1466869863000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688603",
          "name": "Colorado",
          "layer": "region"
        },
        {
          "id": "usnf-3429178507",
          "name": "White River National Forest",
          "layer": "park"
        }
      ],
      "timestamp": 1466875500000
    },
    "createdAt": "2017-02-07T13:37:59.949Z",
    "updatedAt": "2017-02-07T13:38:22.330Z"
  },
  {
    "id": "78f53d00-d7ae-4dbc-a1a8-4450a2014e0f",
    "start": 1466876394000,
    "finish": 1466876527000,
    "featureId": "usnf-3429178507",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688603",
          "name": "Colorado",
          "layer": "region"
        },
        {
          "id": "usnf-3429178507",
          "name": "White River National Forest",
          "layer": "park"
        }
      ],
      "timestamp": 1466876394000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688603",
          "name": "Colorado",
          "layer": "region"
        },
        {
          "id": "usnf-2703867721",
          "name": "Arapaho and Roosevelt National Forests",
          "layer": "park"
        }
      ],
      "timestamp": 1466876527000
    },
    "createdAt": "2017-02-07T13:28:18.787Z",
    "updatedAt": "2017-02-07T13:38:26.996Z"
  },
  {
    "id": "bca3ac41-2916-4c6c-801a-0acc4712f05b",
    "start": 1466876527000,
    "finish": 1467033593000,
    "featureId": "usnf-3429178507",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688603",
          "name": "Colorado",
          "layer": "region"
        },
        {
          "id": "usnf-2703867721",
          "name": "Arapaho and Roosevelt National Forests",
          "layer": "park"
        }
      ],
      "timestamp": 1466876527000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688603",
          "name": "Colorado",
          "layer": "region"
        },
        {
          "id": "usnf-3429178507",
          "name": "White River National Forest",
          "layer": "park"
        }
      ],
      "timestamp": 1467033593000
    },
    "createdAt": "2017-02-07T13:38:26.993Z",
    "updatedAt": "2017-02-07T13:38:26.993Z"
  },
  {
    "id": "88a7c531-6300-4c8f-9bd6-b648f3c12cf6",
    "start": 1467033619000,
    "finish": 1467033755000,
    "featureId": "usnf-3429178507",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688603",
          "name": "Colorado",
          "layer": "region"
        },
        {
          "id": "usnf-3429178507",
          "name": "White River National Forest",
          "layer": "park"
        }
      ],
      "timestamp": 1467033619000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688603",
          "name": "Colorado",
          "layer": "region"
        },
        {
          "id": "usnf-3429178507",
          "name": "White River National Forest",
          "layer": "park"
        }
      ],
      "timestamp": 1467033755000
    },
    "createdAt": "2017-02-07T13:28:25.655Z",
    "updatedAt": "2017-02-07T13:28:30.276Z"
  },
  {
    "id": "0f0057b2-720e-4889-b89e-68a2ec8991af",
    "start": 1467033769000,
    "finish": 1467034275000,
    "featureId": "usnf-3429178507",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688603",
          "name": "Colorado",
          "layer": "region"
        },
        {
          "id": "usnf-3429178507",
          "name": "White River National Forest",
          "layer": "park"
        }
      ],
      "timestamp": 1467033769000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688603",
          "name": "Colorado",
          "layer": "region"
        },
        {
          "id": "usnf-3429178507",
          "name": "White River National Forest",
          "layer": "park"
        }
      ],
      "timestamp": 1467034275000
    },
    "createdAt": "2017-02-07T13:28:30.288Z",
    "updatedAt": "2017-02-07T13:28:43.226Z"
  },
  {
    "id": "c8848d70-fe7f-4080-a756-1d90b7646d9b",
    "start": 1467034308000,
    "finish": 1467034373000,
    "featureId": "usnf-3429178507",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688603",
          "name": "Colorado",
          "layer": "region"
        },
        {
          "id": "usnf-3429178507",
          "name": "White River National Forest",
          "layer": "park"
        }
      ],
      "timestamp": 1467034308000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688603",
          "name": "Colorado",
          "layer": "region"
        },
        {
          "id": "usnf-3429178507",
          "name": "White River National Forest",
          "layer": "park"
        }
      ],
      "timestamp": 1467034373000
    },
    "createdAt": "2017-02-07T13:28:43.240Z",
    "updatedAt": "2017-02-07T13:28:43.240Z"
  },
  {
    "id": "c90420cf-d65d-4d2f-9f3f-f8cc52fad91b",
    "start": 1467034523000,
    "finish": 1467034561000,
    "featureId": "usnf-3429178507",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688603",
          "name": "Colorado",
          "layer": "region"
        },
        {
          "id": "usnf-3429178507",
          "name": "White River National Forest",
          "layer": "park"
        }
      ],
      "timestamp": 1467034523000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688603",
          "name": "Colorado",
          "layer": "region"
        },
        {
          "id": "usnf-3429178507",
          "name": "White River National Forest",
          "layer": "park"
        }
      ],
      "timestamp": 1467034561000
    },
    "createdAt": "2017-02-07T13:28:48.438Z",
    "updatedAt": "2017-02-07T13:28:48.438Z"
  },
  {
    "id": "b3411ab8-e49a-4a5a-859a-4bc8de998326",
    "start": 1466869377000,
    "finish": 1474673046000,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688603",
          "name": "Colorado",
          "layer": "region"
        },
        {
          "id": "usnf-2703867721",
          "name": "Arapaho and Roosevelt National Forests",
          "layer": "park"
        }
      ],
      "timestamp": 1466869377000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        },
        {
          "id": "usnf-1825117944",
          "name": "Tahoe National Forest",
          "layer": "park"
        }
      ],
      "timestamp": 1474673046000
    },
    "createdAt": "2017-02-07T10:59:52.467Z",
    "updatedAt": "2017-02-07T13:37:59.747Z"
  },
  {
    "id": "cc9841a1-4585-45b9-a7d0-84658b70f77a",
    "start": 1474673048000,
    "finish": 1483690374000,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        },
        {
          "id": "usnf-1825117944",
          "name": "Tahoe National Forest",
          "layer": "park"
        }
      ],
      "timestamp": 1474673048000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483690374000
    },
    "createdAt": "2017-02-07T09:55:21.328Z",
    "updatedAt": "2017-02-07T10:59:52.191Z"
  },
  {
    "id": "8e039f7c-b340-438d-b7f6-4d69dedde7ab",
    "start": 1483690374000,
    "finish": 1483691041000,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483690374000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691041000
    },
    "createdAt": "2017-02-07T10:14:11.285Z",
    "updatedAt": "2017-02-07T10:14:38.967Z"
  },
  {
    "id": "7dc1d257-2c56-453e-bf95-aabe3f633c84",
    "start": 1483691041000,
    "finish": 1483691240000,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691041000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691240000
    },
    "createdAt": "2017-02-07T10:14:38.975Z",
    "updatedAt": "2017-02-07T10:14:47.743Z"
  },
  {
    "id": "231c7546-1a11-4e16-9db0-558dddf53baf",
    "start": 1483691240000,
    "finish": 1483691392000,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691240000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691392000
    },
    "createdAt": "2017-02-07T10:14:47.788Z",
    "updatedAt": "2017-02-07T10:15:05.933Z"
  },
  {
    "id": "7ac66cb0-ce6a-4e00-8116-3c5bd4a5d23a",
    "start": 1483691392000,
    "finish": 1483691423000,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691392000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691423000
    },
    "createdAt": "2017-02-07T10:15:05.954Z",
    "updatedAt": "2017-02-07T10:15:05.954Z"
  },
  {
    "id": "10cf458c-8151-4f12-847e-b0ea1f965ec2",
    "start": 1483691423000,
    "finish": 1483691439000,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691423000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691439000
    },
    "createdAt": "2017-02-07T10:15:06.026Z",
    "updatedAt": "2017-02-07T10:15:06.026Z"
  },
  {
    "id": "5f8ccd18-3919-4426-b344-c6c00dd4f35f",
    "start": 1483691439000,
    "finish": 1483691477000,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691439000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691477000
    },
    "createdAt": "2017-02-07T10:15:06.058Z",
    "updatedAt": "2017-02-07T10:15:06.058Z"
  },
  {
    "id": "53687037-bec1-4e8e-9c41-b7be8ef3b200",
    "start": 1483691477000,
    "finish": 1483691481000,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691477000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691481000
    },
    "createdAt": "2017-02-07T10:15:06.081Z",
    "updatedAt": "2017-02-07T10:15:06.081Z"
  },
  {
    "id": "2b9a4b54-076a-43a4-984f-0bcf2b4e140d",
    "start": 1483691481000,
    "finish": 1483691885000,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691481000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691885000
    },
    "createdAt": "2017-02-07T10:15:06.137Z",
    "updatedAt": "2017-02-07T10:15:32.302Z"
  },
  {
    "id": "64cb956f-4869-4685-a0c0-3feab4a87473",
    "start": 1483691885000,
    "finish": 1483691897000,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691885000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691897000
    },
    "createdAt": "2017-02-07T10:15:32.340Z",
    "updatedAt": "2017-02-07T10:15:32.340Z"
  },
  {
    "id": "70211c83-54c1-47fd-ac77-6c3611f0a540",
    "start": 1483691897000,
    "finish": 1483691927000,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691897000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691927000
    },
    "createdAt": "2017-02-07T10:15:32.391Z",
    "updatedAt": "2017-02-07T10:15:32.391Z"
  },
  {
    "id": "bb523784-7008-40f2-9f26-51baab765ac0",
    "start": 1483691927000,
    "finish": 1483692080000,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691927000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483692080000
    },
    "createdAt": "2017-02-07T10:15:32.431Z",
    "updatedAt": "2017-02-07T10:15:39.130Z"
  },
  {
    "id": "b162f60e-24ed-4f6c-bec7-f39e3c202b78",
    "start": 1483692080000,
    "finish": 1483692259000,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483692080000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483692259000
    },
    "createdAt": "2017-02-07T10:15:39.137Z",
    "updatedAt": "2017-02-07T10:15:46.519Z"
  },
  {
    "id": "ae8ddef2-8010-459a-b7d8-32d40dc2a979",
    "start": 1483692259000,
    "finish": 1486443792328,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483692259000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        }
      ],
      "timestamp": 1486443792328.293
    },
    "createdAt": "2017-02-07T10:15:46.536Z",
    "updatedAt": "2017-02-07T13:03:21.850Z"
  },
  {
    "id": "5636f452-8f26-4bc3-b09d-f4a9c0369d0c",
    "start": 1466869377000,
    "finish": 1483690374000,
    "featureId": "wof-85633793",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688603",
          "name": "Colorado",
          "layer": "region"
        },
        {
          "id": "usnf-2703867721",
          "name": "Arapaho and Roosevelt National Forests",
          "layer": "park"
        }
      ],
      "timestamp": 1466869377000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483690374000
    },
    "createdAt": "2017-02-07T09:55:21.421Z",
    "updatedAt": "2017-02-07T13:37:59.860Z"
  },
  {
    "id": "bd29d6f2-3bf1-48d8-a6a6-47248ea07f18",
    "start": 1483690374000,
    "finish": 1483691041000,
    "featureId": "wof-85633793",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483690374000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691041000
    },
    "createdAt": "2017-02-07T10:14:11.284Z",
    "updatedAt": "2017-02-07T10:14:38.966Z"
  },
  {
    "id": "2b4ad6bc-c6f2-45ab-86c1-ffbaa0c0e1e8",
    "start": 1483691041000,
    "finish": 1483691240000,
    "featureId": "wof-85633793",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691041000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691240000
    },
    "createdAt": "2017-02-07T10:14:38.972Z",
    "updatedAt": "2017-02-07T10:14:47.732Z"
  },
  {
    "id": "a885b3bb-db52-496f-9aba-5aa3e36c8093",
    "start": 1483691240000,
    "finish": 1483691392000,
    "featureId": "wof-85633793",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691240000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691392000
    },
    "createdAt": "2017-02-07T10:14:47.761Z",
    "updatedAt": "2017-02-07T10:15:05.947Z"
  },
  {
    "id": "ca772ed9-898a-44dd-9cde-e8d03f2f8f95",
    "start": 1483691392000,
    "finish": 1483691423000,
    "featureId": "wof-85633793",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691392000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691423000
    },
    "createdAt": "2017-02-07T10:15:05.962Z",
    "updatedAt": "2017-02-07T10:15:05.962Z"
  },
  {
    "id": "911e66c9-c9e2-467e-a444-1859ad0c3cfc",
    "start": 1483691423000,
    "finish": 1483691439000,
    "featureId": "wof-85633793",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691423000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691439000
    },
    "createdAt": "2017-02-07T10:15:06.027Z",
    "updatedAt": "2017-02-07T10:15:06.027Z"
  },
  {
    "id": "ceca4538-a861-4468-8529-ca4d9260fdc1",
    "start": 1483691439000,
    "finish": 1483691477000,
    "featureId": "wof-85633793",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691439000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691477000
    },
    "createdAt": "2017-02-07T10:15:06.061Z",
    "updatedAt": "2017-02-07T10:15:06.061Z"
  },
  {
    "id": "606177be-4ae0-46cd-977a-626f30df7fd7",
    "start": 1483691477000,
    "finish": 1483691481000,
    "featureId": "wof-85633793",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691477000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691481000
    },
    "createdAt": "2017-02-07T10:15:06.116Z",
    "updatedAt": "2017-02-07T10:15:06.116Z"
  },
  {
    "id": "902a1669-a7c9-46d0-9406-7d3a72e09b1f",
    "start": 1483691481000,
    "finish": 1483691885000,
    "featureId": "wof-85633793",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691481000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691885000
    },
    "createdAt": "2017-02-07T10:15:06.138Z",
    "updatedAt": "2017-02-07T10:15:32.310Z"
  },
  {
    "id": "e61473ee-f727-41b7-bdb5-4348c2d76784",
    "start": 1483691885000,
    "finish": 1483691897000,
    "featureId": "wof-85633793",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691885000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691897000
    },
    "createdAt": "2017-02-07T10:15:32.320Z",
    "updatedAt": "2017-02-07T10:15:32.320Z"
  },
  {
    "id": "44db0a99-a5ba-44cf-9ac9-3fc932c5acd5",
    "start": 1483691897000,
    "finish": 1483691927000,
    "featureId": "wof-85633793",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691897000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691927000
    },
    "createdAt": "2017-02-07T10:15:32.392Z",
    "updatedAt": "2017-02-07T10:15:32.392Z"
  },
  {
    "id": "3f3405a1-aa4e-4403-9d09-118e24c90572",
    "start": 1483691927000,
    "finish": 1483692080000,
    "featureId": "wof-85633793",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691927000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483692080000
    },
    "createdAt": "2017-02-07T10:15:32.430Z",
    "updatedAt": "2017-02-07T10:15:39.129Z"
  },
  {
    "id": "c88ec65f-ab0b-46de-b026-a2323273620e",
    "start": 1483692080000,
    "finish": 1483692259000,
    "featureId": "wof-85633793",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483692080000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483692259000
    },
    "createdAt": "2017-02-07T10:15:39.139Z",
    "updatedAt": "2017-02-07T10:15:46.517Z"
  },
  {
    "id": "5954dc2a-d786-4511-a718-974fd71c7ffd",
    "start": 1483692259000,
    "finish": 1486443792328,
    "featureId": "wof-85633793",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483692259000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        }
      ],
      "timestamp": 1486443792328.293
    },
    "createdAt": "2017-02-07T10:15:46.528Z",
    "updatedAt": "2017-02-07T13:03:21.859Z"
  },
  {
    "id": "1fa7c164-9d45-476d-b4f9-411f55494de7",
    "start": 1466869377000,
    "finish": 1467039608000,
    "featureId": "wof-85688603",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688603",
          "name": "Colorado",
          "layer": "region"
        },
        {
          "id": "usnf-2703867721",
          "name": "Arapaho and Roosevelt National Forests",
          "layer": "park"
        }
      ],
      "timestamp": 1466869377000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688603",
          "name": "Colorado",
          "layer": "region"
        },
        {
          "id": "usnf-2318597394",
          "name": "Grand Mesa, Uncompahgre and Gunnison National Forests",
          "layer": "park"
        }
      ],
      "timestamp": 1467039608000
    },
    "createdAt": "2017-02-07T13:26:27.568Z",
    "updatedAt": "2017-02-07T13:37:58.543Z"
  }];

        let intersections = [{
            "userId": "user1",
            "features": [
                {
                "id": "usnf-3429178507",
                "name": "White River National Forest",
                "layer": "park"
                }
            ],
            "timestamp": 1466877228000
        }];

        runIntersections(existingVisits, intersections, (err, newVisits) => {
            assert(!err);
            assert(newVisits);

            done();
        });
    });

    it('strava issue', function(done) {
      let existingVisits = [
  {
    "id": "16c65fd0-3f22-4373-b16f-89edbfccb76f",
    "start": 1450634422000,
    "finish": 1454785894000,
    "featureId": "casp-1087893243",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        },
        {
          "id": "casp-1087893243",
          "name": "Wilder Ranch SP",
          "layer": "park"
        },
        {
          "id": "casp-4220598026",
          "name": "Wilder Dairy CP",
          "layer": "park"
        }
      ],
      "timestamp": 1450634422000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        },
        {
          "id": "casp-1087893243",
          "name": "Wilder Ranch SP",
          "layer": "park"
        }
      ],
      "timestamp": 1454785894000
    },
    "createdAt": "2017-02-09T01:19:14.719Z",
    "updatedAt": "2017-02-09T01:54:07.365Z"
  },
  {
    "id": "826bba94-6193-436c-8540-956b25daaea8",
    "start": 1449441391000,
    "finish": 1451765983000,
    "featureId": "casp-1223894223",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        },
        {
          "id": "casp-1223894223",
          "name": "Twin Lakes SB",
          "layer": "park"
        }
      ],
      "timestamp": 1449441391000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        },
        {
          "id": "casp-3020349416",
          "name": "Andrew Molera SP",
          "layer": "park"
        }
      ],
      "timestamp": 1451765983000
    },
    "createdAt": "2017-02-09T01:04:36.797Z",
    "updatedAt": "2017-02-09T02:07:20.428Z"
  },
  {
    "id": "ef09b79e-f916-4cd6-9f48-302f7a387265",
    "start": 1451765983000,
    "finish": 1455327636000,
    "featureId": "casp-1223894223",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        },
        {
          "id": "casp-3020349416",
          "name": "Andrew Molera SP",
          "layer": "park"
        }
      ],
      "timestamp": 1451765983000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        },
        {
          "id": "casp-1223894223",
          "name": "Twin Lakes SB",
          "layer": "park"
        }
      ],
      "timestamp": 1455327636000
    },
    "createdAt": "2017-02-09T01:42:59.345Z",
    "updatedAt": "2017-02-09T01:42:59.345Z"
  },
  {
    "id": "8a405617-4159-4602-9da6-156b06d00682",
    "start": 1456004303000,
    "finish": 1459985368000,
    "featureId": "casp-1223894223",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        },
        {
          "id": "casp-1223894223",
          "name": "Twin Lakes SB",
          "layer": "park"
        }
      ],
      "timestamp": 1456004303000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        },
        {
          "id": "casp-1223894223",
          "name": "Twin Lakes SB",
          "layer": "park"
        }
      ],
      "timestamp": 1459985368000
    },
    "createdAt": "2017-02-08T07:09:45.964Z",
    "updatedAt": "2017-02-09T00:44:21.479Z"
  },
  {
    "id": "bbaaa34d-d47d-40c8-a5a5-0bb103f37bcd",
    "start": 1468087015000,
    "finish": 1468087071000,
    "featureId": "casp-1223894223",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        },
        {
          "id": "casp-1223894223",
          "name": "Twin Lakes SB",
          "layer": "park"
        }
      ],
      "timestamp": 1468087015000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        },
        {
          "id": "casp-1223894223",
          "name": "Twin Lakes SB",
          "layer": "park"
        }
      ],
      "timestamp": 1468087071000
    },
    "createdAt": "2017-02-07T12:53:07.541Z",
    "updatedAt": "2017-02-07T12:53:11.773Z"
  },
  {
    "id": "73cf131c-7bca-4473-af6c-dbdef267e4a8",
    "start": 1471824464000,
    "finish": 1471824495000,
    "featureId": "casp-1223894223",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        },
        {
          "id": "casp-1223894223",
          "name": "Twin Lakes SB",
          "layer": "park"
        }
      ],
      "timestamp": 1471824464000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        },
        {
          "id": "casp-1223894223",
          "name": "Twin Lakes SB",
          "layer": "park"
        }
      ],
      "timestamp": 1471824495000
    },
    "createdAt": "2017-02-07T11:58:49.204Z",
    "updatedAt": "2017-02-07T11:58:49.204Z"
  },
  {
    "id": "84f25677-de74-4d9c-8e1f-788f60965c80",
    "start": 1476571637000,
    "finish": 1480283505000,
    "featureId": "casp-1223894223",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        },
        {
          "id": "casp-1223894223",
          "name": "Twin Lakes SB",
          "layer": "park"
        }
      ],
      "timestamp": 1476571637000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        },
        {
          "id": "casp-1223894223",
          "name": "Twin Lakes SB",
          "layer": "park"
        }
      ],
      "timestamp": 1480283505000
    },
    "createdAt": "2017-02-07T10:46:38.276Z",
    "updatedAt": "2017-02-07T10:53:02.143Z"
  },
  {
    "id": "5bda10fe-cbbd-4708-94da-543217195249",
    "start": 1450633849000,
    "finish": 1454781382000,
    "featureId": "casp-263136887",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        },
        {
          "id": "casp-2527187433",
          "name": "Natural Bridges SB",
          "layer": "park"
        },
        {
          "id": "casp-263136887",
          "name": "Monarch Butterfly NP",
          "layer": "park"
        }
      ],
      "timestamp": 1450633849000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        },
        {
          "id": "casp-1087893243",
          "name": "Wilder Ranch SP",
          "layer": "park"
        },
        {
          "id": "casp-4220598026",
          "name": "Wilder Dairy CP",
          "layer": "park"
        }
      ],
      "timestamp": 1454781382000
    },
    "createdAt": "2017-02-09T00:45:40.638Z",
    "updatedAt": "2017-02-09T01:53:22.535Z"
  },
  {
    "id": "aad45c3b-6e51-4a43-b41e-0979b64cd44e",
    "start": 1450633792000,
    "finish": 1454781382000,
    "featureId": "casp-2916694474",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        },
        {
          "id": "casp-2527187433",
          "name": "Natural Bridges SB",
          "layer": "park"
        },
        {
          "id": "casp-263136887",
          "name": "Monarch Butterfly NP",
          "layer": "park"
        }
      ],
      "timestamp": 1450633792000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        },
        {
          "id": "casp-1087893243",
          "name": "Wilder Ranch SP",
          "layer": "park"
        },
        {
          "id": "casp-4220598026",
          "name": "Wilder Dairy CP",
          "layer": "park"
        }
      ],
      "timestamp": 1454781382000
    },
    "createdAt": "2017-02-09T01:53:23.347Z",
    "updatedAt": "2017-02-09T01:53:23.347Z"
  },
  {
    "id": "f169ea8e-11d1-40fd-8afe-0c95202987d3",
    "start": 1450634422000,
    "finish": 1454781430000,
    "featureId": "casp-4220598026",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        },
        {
          "id": "casp-1087893243",
          "name": "Wilder Ranch SP",
          "layer": "park"
        },
        {
          "id": "casp-4220598026",
          "name": "Wilder Dairy CP",
          "layer": "park"
        }
      ],
      "timestamp": 1450634422000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        },
        {
          "id": "casp-1087893243",
          "name": "Wilder Ranch SP",
          "layer": "park"
        },
        {
          "id": "casp-4220598026",
          "name": "Wilder Dairy CP",
          "layer": "park"
        }
      ],
      "timestamp": 1454781430000
    },
    "createdAt": "2017-02-09T01:19:14.720Z",
    "updatedAt": "2017-02-09T01:54:07.375Z"
  },
  {
    "id": "8b27b475-77e2-461e-8293-bda873e147f2",
    "start": 1449435591000,
    "finish": 1463094285000,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        }
      ],
      "timestamp": 1449435591000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        }
      ],
      "timestamp": 1463094285000
    },
    "createdAt": "2017-02-08T05:21:56.765Z",
    "updatedAt": "2017-02-09T02:01:24.162Z"
  },
  {
    "id": "b3411ab8-e49a-4a5a-859a-4bc8de998326",
    "start": 1463241490000,
    "finish": 1474673046000,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        }
      ],
      "timestamp": 1463241490000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        },
        {
          "id": "usnf-1825117944",
          "name": "Tahoe National Forest",
          "layer": "park"
        }
      ],
      "timestamp": 1474673046000
    },
    "createdAt": "2017-02-07T10:59:52.467Z",
    "updatedAt": "2017-02-08T04:59:13.341Z"
  },
  {
    "id": "cc9841a1-4585-45b9-a7d0-84658b70f77a",
    "start": 1474673048000,
    "finish": 1483690374000,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        },
        {
          "id": "usnf-1825117944",
          "name": "Tahoe National Forest",
          "layer": "park"
        }
      ],
      "timestamp": 1474673048000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483690374000
    },
    "createdAt": "2017-02-07T09:55:21.328Z",
    "updatedAt": "2017-02-07T10:59:52.191Z"
  },
  {
    "id": "8e039f7c-b340-438d-b7f6-4d69dedde7ab",
    "start": 1483690374000,
    "finish": 1483691041000,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483690374000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691041000
    },
    "createdAt": "2017-02-07T10:14:11.285Z",
    "updatedAt": "2017-02-07T10:14:38.967Z"
  },
  {
    "id": "7dc1d257-2c56-453e-bf95-aabe3f633c84",
    "start": 1483691041000,
    "finish": 1483691240000,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691041000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691240000
    },
    "createdAt": "2017-02-07T10:14:38.975Z",
    "updatedAt": "2017-02-07T10:14:47.743Z"
  },
  {
    "id": "231c7546-1a11-4e16-9db0-558dddf53baf",
    "start": 1483691240000,
    "finish": 1483691392000,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691240000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691392000
    },
    "createdAt": "2017-02-07T10:14:47.788Z",
    "updatedAt": "2017-02-07T10:15:05.933Z"
  },
  {
    "id": "7ac66cb0-ce6a-4e00-8116-3c5bd4a5d23a",
    "start": 1483691392000,
    "finish": 1483691423000,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691392000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691423000
    },
    "createdAt": "2017-02-07T10:15:05.954Z",
    "updatedAt": "2017-02-07T10:15:05.954Z"
  },
  {
    "id": "10cf458c-8151-4f12-847e-b0ea1f965ec2",
    "start": 1483691423000,
    "finish": 1483691439000,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691423000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691439000
    },
    "createdAt": "2017-02-07T10:15:06.026Z",
    "updatedAt": "2017-02-07T10:15:06.026Z"
  },
  {
    "id": "5f8ccd18-3919-4426-b344-c6c00dd4f35f",
    "start": 1483691439000,
    "finish": 1483691477000,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691439000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691477000
    },
    "createdAt": "2017-02-07T10:15:06.058Z",
    "updatedAt": "2017-02-07T10:15:06.058Z"
  },
  {
    "id": "53687037-bec1-4e8e-9c41-b7be8ef3b200",
    "start": 1483691477000,
    "finish": 1483691481000,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691477000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691481000
    },
    "createdAt": "2017-02-07T10:15:06.081Z",
    "updatedAt": "2017-02-07T10:15:06.081Z"
  },
  {
    "id": "2b9a4b54-076a-43a4-984f-0bcf2b4e140d",
    "start": 1483691481000,
    "finish": 1483691885000,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691481000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691885000
    },
    "createdAt": "2017-02-07T10:15:06.137Z",
    "updatedAt": "2017-02-07T10:15:32.302Z"
  },
  {
    "id": "64cb956f-4869-4685-a0c0-3feab4a87473",
    "start": 1483691885000,
    "finish": 1483691897000,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691885000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691897000
    },
    "createdAt": "2017-02-07T10:15:32.340Z",
    "updatedAt": "2017-02-07T10:15:32.340Z"
  },
  {
    "id": "70211c83-54c1-47fd-ac77-6c3611f0a540",
    "start": 1483691897000,
    "finish": 1483691927000,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691897000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691927000
    },
    "createdAt": "2017-02-07T10:15:32.391Z",
    "updatedAt": "2017-02-07T10:15:32.391Z"
  },
  {
    "id": "bb523784-7008-40f2-9f26-51baab765ac0",
    "start": 1483691927000,
    "finish": 1483692080000,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691927000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483692080000
    },
    "createdAt": "2017-02-07T10:15:32.431Z",
    "updatedAt": "2017-02-07T10:15:39.130Z"
  },
  {
    "id": "b162f60e-24ed-4f6c-bec7-f39e3c202b78",
    "start": 1483692080000,
    "finish": 1483692259000,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483692080000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483692259000
    },
    "createdAt": "2017-02-07T10:15:39.137Z",
    "updatedAt": "2017-02-07T10:15:46.519Z"
  },
  {
    "id": "ae8ddef2-8010-459a-b7d8-32d40dc2a979",
    "start": 1483692259000,
    "finish": 1486569998812,
    "featureId": "wof-102191575",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483692259000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        }
      ],
      "timestamp": 1486569998811.9412
    },
    "createdAt": "2017-02-07T10:15:46.536Z",
    "updatedAt": "2017-02-09T00:06:43.301Z"
  },
  {
    "id": "22bf2ebe-8f00-46a8-99af-634f8d3f3c8b",
    "start": 1449435591000,
    "finish": 1463089859000,
    "featureId": "wof-85633793",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        }
      ],
      "timestamp": 1449435591000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        }
      ],
      "timestamp": 1463089859000
    },
    "createdAt": "2017-02-08T05:21:57.325Z",
    "updatedAt": "2017-02-09T02:01:22.709Z"
  },
  {
    "id": "5636f452-8f26-4bc3-b09d-f4a9c0369d0c",
    "start": 1463089868000,
    "finish": 1483690374000,
    "featureId": "wof-85633793",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        }
      ],
      "timestamp": 1463089868000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483690374000
    },
    "createdAt": "2017-02-07T09:55:21.421Z",
    "updatedAt": "2017-02-08T05:21:55.859Z"
  },
  {
    "id": "bd29d6f2-3bf1-48d8-a6a6-47248ea07f18",
    "start": 1483690374000,
    "finish": 1483691041000,
    "featureId": "wof-85633793",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483690374000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691041000
    },
    "createdAt": "2017-02-07T10:14:11.284Z",
    "updatedAt": "2017-02-07T10:14:38.966Z"
  },
  {
    "id": "2b4ad6bc-c6f2-45ab-86c1-ffbaa0c0e1e8",
    "start": 1483691041000,
    "finish": 1483691240000,
    "featureId": "wof-85633793",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691041000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691240000
    },
    "createdAt": "2017-02-07T10:14:38.972Z",
    "updatedAt": "2017-02-07T10:14:47.732Z"
  },
  {
    "id": "a885b3bb-db52-496f-9aba-5aa3e36c8093",
    "start": 1483691240000,
    "finish": 1483691392000,
    "featureId": "wof-85633793",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691240000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691392000
    },
    "createdAt": "2017-02-07T10:14:47.761Z",
    "updatedAt": "2017-02-07T10:15:05.947Z"
  },
  {
    "id": "ca772ed9-898a-44dd-9cde-e8d03f2f8f95",
    "start": 1483691392000,
    "finish": 1483691423000,
    "featureId": "wof-85633793",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691392000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691423000
    },
    "createdAt": "2017-02-07T10:15:05.962Z",
    "updatedAt": "2017-02-07T10:15:05.962Z"
  },
  {
    "id": "911e66c9-c9e2-467e-a444-1859ad0c3cfc",
    "start": 1483691423000,
    "finish": 1483691439000,
    "featureId": "wof-85633793",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691423000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691439000
    },
    "createdAt": "2017-02-07T10:15:06.027Z",
    "updatedAt": "2017-02-07T10:15:06.027Z"
  },
  {
    "id": "ceca4538-a861-4468-8529-ca4d9260fdc1",
    "start": 1483691439000,
    "finish": 1483691477000,
    "featureId": "wof-85633793",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691439000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691477000
    },
    "createdAt": "2017-02-07T10:15:06.061Z",
    "updatedAt": "2017-02-07T10:15:06.061Z"
  },
  {
    "id": "606177be-4ae0-46cd-977a-626f30df7fd7",
    "start": 1483691477000,
    "finish": 1483691481000,
    "featureId": "wof-85633793",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691477000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691481000
    },
    "createdAt": "2017-02-07T10:15:06.116Z",
    "updatedAt": "2017-02-07T10:15:06.116Z"
  },
  {
    "id": "902a1669-a7c9-46d0-9406-7d3a72e09b1f",
    "start": 1483691481000,
    "finish": 1483691885000,
    "featureId": "wof-85633793",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691481000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691885000
    },
    "createdAt": "2017-02-07T10:15:06.138Z",
    "updatedAt": "2017-02-07T10:15:32.310Z"
  },
  {
    "id": "e61473ee-f727-41b7-bdb5-4348c2d76784",
    "start": 1483691885000,
    "finish": 1483691897000,
    "featureId": "wof-85633793",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691885000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691897000
    },
    "createdAt": "2017-02-07T10:15:32.320Z",
    "updatedAt": "2017-02-07T10:15:32.320Z"
  },
  {
    "id": "44db0a99-a5ba-44cf-9ac9-3fc932c5acd5",
    "start": 1483691897000,
    "finish": 1483691927000,
    "featureId": "wof-85633793",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691897000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691927000
    },
    "createdAt": "2017-02-07T10:15:32.392Z",
    "updatedAt": "2017-02-07T10:15:32.392Z"
  },
  {
    "id": "3f3405a1-aa4e-4403-9d09-118e24c90572",
    "start": 1483691927000,
    "finish": 1483692080000,
    "featureId": "wof-85633793",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691927000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483692080000
    },
    "createdAt": "2017-02-07T10:15:32.430Z",
    "updatedAt": "2017-02-07T10:15:39.129Z"
  },
  {
    "id": "c88ec65f-ab0b-46de-b026-a2323273620e",
    "start": 1483692080000,
    "finish": 1483692259000,
    "featureId": "wof-85633793",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483692080000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483692259000
    },
    "createdAt": "2017-02-07T10:15:39.139Z",
    "updatedAt": "2017-02-07T10:15:46.517Z"
  },
  {
    "id": "5954dc2a-d786-4511-a718-974fd71c7ffd",
    "start": 1483692259000,
    "finish": 1486569998812,
    "featureId": "wof-85633793",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483692259000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        }
      ],
      "timestamp": 1486569998811.9412
    },
    "createdAt": "2017-02-07T10:15:46.528Z",
    "updatedAt": "2017-02-09T00:06:43.303Z"
  },
  {
    "id": "b8c35cc3-0dd6-4c75-b052-ae904c6a2cd7",
    "start": 1449435591000,
    "finish": 1466205246000,
    "featureId": "wof-85688637",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        }
      ],
      "timestamp": 1449435591000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        }
      ],
      "timestamp": 1466205246000
    },
    "createdAt": "2017-02-08T03:36:55.427Z",
    "updatedAt": "2017-02-09T02:01:24.253Z"
  },
  {
    "id": "4585154e-ec9f-49b4-ba51-06de83996a93",
    "start": 1467474635000,
    "finish": 1468792596000,
    "featureId": "wof-85688637",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        }
      ],
      "timestamp": 1467474635000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        }
      ],
      "timestamp": 1468792596000
    },
    "createdAt": "2017-02-07T12:19:25.753Z",
    "updatedAt": "2017-02-07T13:15:12.532Z"
  },
  {
    "id": "49d4c72e-3a01-4ff2-91e1-d6d9e3063970",
    "start": 1471647481000,
    "finish": 1482758861000,
    "featureId": "wof-85688637",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        }
      ],
      "timestamp": 1471647481000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688599",
          "name": "Michigan",
          "layer": "region"
        }
      ],
      "timestamp": 1482758861000
    },
    "createdAt": "2017-02-07T09:55:21.517Z",
    "updatedAt": "2017-02-07T12:00:07.628Z"
  },
  {
    "id": "b7b002c2-6b3f-447e-8142-cbb98cbc676f",
    "start": 1482758861000,
    "finish": 1483690374000,
    "featureId": "wof-85688637",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688599",
          "name": "Michigan",
          "layer": "region"
        }
      ],
      "timestamp": 1482758861000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483690374000
    },
    "createdAt": "2017-02-07T10:23:09.042Z",
    "updatedAt": "2017-02-07T10:23:09.042Z"
  },
  {
    "id": "d2f7ebab-f74e-42b9-815e-be7e2765c4eb",
    "start": 1483690374000,
    "finish": 1483691041000,
    "featureId": "wof-85688637",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483690374000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691041000
    },
    "createdAt": "2017-02-07T10:14:11.293Z",
    "updatedAt": "2017-02-07T10:14:38.969Z"
  },
  {
    "id": "b211b836-c078-44ee-9c8b-4ce37bad3d2c",
    "start": 1483691041000,
    "finish": 1483691240000,
    "featureId": "wof-85688637",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691041000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691240000
    },
    "createdAt": "2017-02-07T10:14:38.972Z",
    "updatedAt": "2017-02-07T10:14:47.737Z"
  },
  {
    "id": "2cdf6c1c-7b9a-4924-8a73-0ed575738803",
    "start": 1483691240000,
    "finish": 1483691392000,
    "featureId": "wof-85688637",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691240000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691392000
    },
    "createdAt": "2017-02-07T10:14:47.764Z",
    "updatedAt": "2017-02-07T10:15:05.950Z"
  },
  {
    "id": "58c2240d-d1ef-41e5-8a28-9b6e3b62bc64",
    "start": 1483691392000,
    "finish": 1483691423000,
    "featureId": "wof-85688637",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691392000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691423000
    },
    "createdAt": "2017-02-07T10:15:05.969Z",
    "updatedAt": "2017-02-07T10:15:05.969Z"
  },
  {
    "id": "57f5bb3b-9228-4f8c-96c7-f7508e017144",
    "start": 1483691423000,
    "finish": 1483691439000,
    "featureId": "wof-85688637",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691423000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691439000
    },
    "createdAt": "2017-02-07T10:15:06.044Z",
    "updatedAt": "2017-02-07T10:15:06.044Z"
  },
  {
    "id": "4afb7101-d7bb-4c37-85c5-72cb9f3a38e5",
    "start": 1483691439000,
    "finish": 1483691477000,
    "featureId": "wof-85688637",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691439000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691477000
    },
    "createdAt": "2017-02-07T10:15:06.065Z",
    "updatedAt": "2017-02-07T10:15:06.065Z"
  },
  {
    "id": "5bda309e-c70d-49a0-9614-6b6c0bded5e2",
    "start": 1483691477000,
    "finish": 1483691481000,
    "featureId": "wof-85688637",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691477000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691481000
    },
    "createdAt": "2017-02-07T10:15:06.120Z",
    "updatedAt": "2017-02-07T10:15:06.120Z"
  },
  {
    "id": "c83d689d-f177-48e6-9992-3b6f0ceff2ab",
    "start": 1483691481000,
    "finish": 1483691885000,
    "featureId": "wof-85688637",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691481000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691885000
    },
    "createdAt": "2017-02-07T10:15:06.144Z",
    "updatedAt": "2017-02-07T10:15:32.311Z"
  },
  {
    "id": "822f7f41-68d8-477f-babd-ecc81259b798",
    "start": 1483691885000,
    "finish": 1483691897000,
    "featureId": "wof-85688637",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691885000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691897000
    },
    "createdAt": "2017-02-07T10:15:32.325Z",
    "updatedAt": "2017-02-07T10:15:32.325Z"
  },
  {
    "id": "f20359cc-2404-4b7c-bd1d-e3a3357a7f53",
    "start": 1483691897000,
    "finish": 1483691927000,
    "featureId": "wof-85688637",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483691897000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691927000
    },
    "createdAt": "2017-02-07T10:15:32.400Z",
    "updatedAt": "2017-02-07T10:15:32.400Z"
  },
  {
    "id": "3cb5fcfd-3787-43be-b14c-a373cb4d6b7b",
    "start": 1483691927000,
    "finish": 1483692080000,
    "featureId": "wof-85688637",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483691927000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483692080000
    },
    "createdAt": "2017-02-07T10:15:32.440Z",
    "updatedAt": "2017-02-07T10:15:39.129Z"
  },
  {
    "id": "db8a735e-b7ec-4505-b555-0acecb7e8960",
    "start": 1483692080000,
    "finish": 1483692259000,
    "featureId": "wof-85688637",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85683667",
          "name": "Kensington and Chelsea",
          "layer": "region"
        }
      ],
      "timestamp": 1483692080000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483692259000
    },
    "createdAt": "2017-02-07T10:15:39.164Z",
    "updatedAt": "2017-02-07T10:15:46.516Z"
  },
  {
    "id": "f06dcd72-b7d4-4d9a-a58b-0f37a644b663",
    "start": 1483692259000,
    "finish": 1486569998812,
    "featureId": "wof-85688637",
    "userId": "user1",
    "startIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191581",
          "name": "Europe",
          "layer": "continent"
        },
        {
          "id": "wof-404227469",
          "name": "England",
          "layer": "macroregion"
        },
        {
          "id": "wof-85633159",
          "name": "United Kingdom",
          "layer": "country"
        },
        {
          "id": "wof-85684061",
          "name": "City of Westminster",
          "layer": "region"
        }
      ],
      "timestamp": 1483692259000
    },
    "finishIntersection": {
      "userId": "user1",
      "features": [
        {
          "id": "wof-102191575",
          "name": "North America",
          "layer": "continent"
        },
        {
          "id": "wof-85633793",
          "name": "United States",
          "layer": "country"
        },
        {
          "id": "wof-85688637",
          "name": "California",
          "layer": "region"
        }
      ],
      "timestamp": 1486569998811.9412
    },
    "createdAt": "2017-02-07T10:15:46.556Z",
    "updatedAt": "2017-02-09T00:06:43.293Z"
  }
];

        let intersections = [{
  "userId": "user1",
  "features": [
    {
      "id": "casp-1223894223",
      "name": "Twin Lakes SB",
      "layer": "park"
    }
  ],
  "timestamp": 1451428194000
}];

        runIntersections(existingVisits, intersections, (err, newVisits) => {
            assert(!err);
            assert(newVisits);

            done();
        });
    });

    it('can update visits from intersection', function(done) {
        services.visits.updateVisitsFromIntersections(fixtures.intersections, err => {
            assert(!err);
            done();
        });
    });
});
