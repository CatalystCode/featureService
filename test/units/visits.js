"use strict"

var app = require('../../server')
  , assert = require('assert')
  , fixtures = require('../fixtures')
  , services = require('../../services');

describe('visits service', function() {
    it('can upsert visit', function(done) {
        services.visits.upsert([ fixtures.visit ], err => {
            assert(!err);
            done();
        });
    });

    it('create first visit test case', function(done) {
        let currentVisits = {};

        let intersection = {
            userId: 'user1',
            features: [
                { id: 'CA' },
                { id: 'SC' }
            ],
            timestamp: 2
        };

        let newVisits = services.visits.intersectVisits(currentVisits, intersection);

        assert(newVisits);
        assert.equal(Object.keys(newVisits).length, 2);

        let firstKey = Object.keys(newVisits)[0];
        let secondKey = Object.keys(newVisits)[1];

        assert.equal(newVisits[firstKey].userId, 'user1');
        assert.equal(newVisits[firstKey].start, 2);
        assert.equal(newVisits[firstKey].finish, 2);
        assert.equal(newVisits[firstKey].featureId, 'CA');
        assert.equal(newVisits[firstKey].startIntersection, intersection);
        assert.equal(newVisits[firstKey].finishIntersection, intersection);

        assert.equal(newVisits[secondKey].userId, 'user1');
        assert.equal(newVisits[secondKey].start, 2);
        assert.equal(newVisits[secondKey].finish, 2);
        assert.equal(newVisits[secondKey].featureId, 'SC');
        assert.equal(newVisits[secondKey].startIntersection, intersection);
        assert.equal(newVisits[secondKey].finishIntersection, intersection);

        done();
    });

    it('extend visit test case', function(done) {
        let currentVisits = {
            "d12aaf55-8b97-49b0-9bcf-5228efd5b483": {
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
            },
            "6c0bf206-ee51-4266-b967-5544bb236a79": {
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
            }
        };

        let intersection = {
            userId: 'user1',
            features: [
                { id: 'CA' },
                { id: 'AP' }
            ],
            timestamp: 5
        };

        let newVisits = services.visits.intersectVisits(currentVisits, intersection);

        assert(newVisits);
        assert.equal(Object.keys(newVisits).length, 3);

        let firstKey = Object.keys(newVisits)[0];
        let thirdKey = Object.keys(newVisits)[2];

        assert.equal(newVisits[firstKey].userId, 'user1');
        assert.equal(newVisits[firstKey].start, 2);
        assert.equal(newVisits[firstKey].finish, 5);
        assert.equal(newVisits[firstKey].featureId, 'CA');
        assert.equal(newVisits[firstKey].finishIntersection, intersection);

        assert.equal(newVisits[thirdKey].userId, 'user1');
        assert.equal(newVisits[thirdKey].start, 5);
        assert.equal(newVisits[thirdKey].finish, 5);
        assert.equal(newVisits[thirdKey].featureId, 'AP');
        assert.equal(newVisits[thirdKey].startIntersection, intersection);
        assert.equal(newVisits[thirdKey].finishIntersection, intersection);

        done();
    });

    it('extends with aftervisit', function(done) {
        let currentVisits = {
            "d12aaf55-8b97-49b0-9bcf-5228efd5b483": {
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
            },
            "6c0bf206-ee51-4266-b967-5544bb236a79": {
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
            },
            "846df10c-46c0-42db-b150-80a8c3cf4d1d": {
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
            }
        };

        let intersection = {
            userId: 'user1',
            features: [
                { id: 'CA' },
                { id: 'SC' }
            ],
            timestamp: 1
        };

        let newVisits = services.visits.intersectVisits(currentVisits, intersection);

        assert(newVisits);
        assert.equal(Object.keys(newVisits).length, 3);

        let firstKey = Object.keys(newVisits)[0];
        let secondKey = Object.keys(newVisits)[1];
        let thirdKey = Object.keys(newVisits)[2];

        assert.equal(newVisits[firstKey].userId, 'user1');
        assert.equal(newVisits[firstKey].start, 1);
        assert.equal(newVisits[firstKey].finish, 5);
        assert.equal(newVisits[firstKey].featureId, 'CA');

        assert.equal(newVisits[secondKey].userId, 'user1');
        assert.equal(newVisits[secondKey].start, 1);
        assert.equal(newVisits[secondKey].finish, 2);
        assert.equal(newVisits[secondKey].featureId, 'SC');

        assert.equal(newVisits[thirdKey].start, 5);
        assert.equal(newVisits[thirdKey].finish, 5);
        assert.equal(newVisits[thirdKey].featureId, 'AP');

        done();
    });

    it('extends with beforevisit', function(done) {
        let currentVisits = {
            "d12aaf55-8b97-49b0-9bcf-5228efd5b483": {
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
            },
            "6c0bf206-ee51-4266-b967-5544bb236a79": {
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
            },
            "846df10c-46c0-42db-b150-80a8c3cf4d1d": {
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
            }
        };

        let intersection = {
            userId: 'user1',
            features: [
                { id: 'CA' },
                { id: 'AP' }
            ],
            timestamp: 3
        };

        let newVisits = services.visits.intersectVisits(currentVisits, intersection);

        assert(newVisits);
        assert.equal(Object.keys(newVisits).length, 3);

        let firstKey = Object.keys(newVisits)[0];
        let secondKey = Object.keys(newVisits)[1];
        let thirdKey = Object.keys(newVisits)[2];

        assert.equal(newVisits[firstKey].userId, 'user1');
        assert.equal(newVisits[firstKey].start, 1);
        assert.equal(newVisits[firstKey].finish, 5);
        assert.equal(newVisits[firstKey].featureId, 'CA');

        assert.equal(newVisits[secondKey].userId, 'user1');
        assert.equal(newVisits[secondKey].start, 1);
        assert.equal(newVisits[secondKey].finish, 2);
        assert.equal(newVisits[secondKey].featureId, 'SC');

        assert.equal(newVisits[thirdKey].start, 3);
        assert.equal(newVisits[thirdKey].finish, 5);
        assert.equal(newVisits[thirdKey].featureId, 'AP');

        done();
    });

    it('splits with visit spanning intersection check', function(done) {
        let currentVisits = {
            "d12aaf55-8b97-49b0-9bcf-5228efd5b483": {
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
            },
            "6c0bf206-ee51-4266-b967-5544bb236a79": {
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
            },
            "846df10c-46c0-42db-b150-80a8c3cf4d1d": {
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
            }
        };

        let intersection = {
            userId: 'user1',
            features: [
                { id: 'CA' },
                { id: 'SC' }
            ],
            timestamp: 4
        };

        let newVisits = services.visits.intersectVisits(currentVisits, intersection);

        assert(newVisits);
        assert.equal(Object.keys(newVisits).length, 5);

        let secondKey = Object.keys(newVisits)[2];
        let thirdKey = Object.keys(newVisits)[3];
        let fourthKey = Object.keys(newVisits)[4];

        assert.equal(newVisits[secondKey].start, 3);
        assert.equal(newVisits[secondKey].finish, 4);
        assert.equal(newVisits[secondKey].featureId, 'AP');

        assert.equal(newVisits[thirdKey].start, 4);
        assert.equal(newVisits[thirdKey].finish, 5);
        assert.equal(newVisits[thirdKey].featureId, 'AP');

        assert.equal(newVisits[fourthKey].start, 4);
        assert.equal(newVisits[fourthKey].finish, 4);
        assert.equal(newVisits[fourthKey].featureId, 'SC');

        done();
    });

    it('applying the same intersection twice is a nop', function(done) {
        let currentVisits = {
            "d12aaf55-8b97-49b0-9bcf-5228efd5b483": {
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
            },
            "6c0bf206-ee51-4266-b967-5544bb236a79": {
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
            },
            "846df10c-46c0-42db-b150-80a8c3cf4d1d": {
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
            }
        };

        let intersection = {
            userId: 'user1',
            features: [
                { id: 'CA' },
                { id: 'AP' }
            ],
            timestamp: 3
        };

        let newVisits = services.visits.intersectVisits(currentVisits, intersection);

        assert.equal(JSON.stringify(newVisits), JSON.stringify(currentVisits));

        done();
    });

    it('can update visits from intersection', function(done) {
        services.visits.updateVisitsFromIntersection(fixtures.intersection, err => {
            assert(!err);
            done();
        });
    });
});