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
            console.log(err);
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

    it('can update visits from intersection', function(done) {
        services.visits.updateVisitsFromIntersections([fixtures.intersection], err => {
            assert(!err);
            done();
        });
    });
});