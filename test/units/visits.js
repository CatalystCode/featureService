"use strict"

let app = require('../../server'),
    assert = require('assert'),
    common = require('service-utils'),
    fixtures = require('../fixtures'),
    services = require('../../services');

describe('visits service', function() {
    it('can upsert visit', function(done) {
        services.visits.upsert([ fixtures.visit ], err => {
            assert(!err);
            done();
        });
    });

    it('can get visit', function(done) {
        services.visits.getByUserId(fixtures.visit.userId, (err, visits) => {
            assert(!err);
            assert(visits);
            assert(visits.length > 0);

            done();
        });
    });
});