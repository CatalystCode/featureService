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

    it('can get open visits', function(done) {
        services.visits.getVisits('open', fixtures.userId, (err, visits) => {
            assert(!err);
            assert(visits);
            assert.equal(visits.length, 3);

            assert(!visits[0].user_id);
            assert.equal(visits[0].userId, fixtures.userId);
            assert.equal(visits[0].finish, null);

            done();
        });
    })
});