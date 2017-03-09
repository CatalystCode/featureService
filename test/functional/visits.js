"use strict"

const assert = require('assert'),
      app = require('../../server'),
      fixtures = require('../fixtures'),
      HttpStatus = require('http-status-codes'),
      request = require('request');

const visitsEndpoint = 'http://localhost:' + process.env.PORT + '/visits';

describe('visits endpoint', function() {
    it('can put user visits', function(done) {
        request.put(`${visitsEndpoint}/${fixtures.userId}`, {
            headers: {
                Authorization: "Bearer " + fixtures.accessToken
            },
            body: {
                visits: [
                    fixtures.visit
                ]
            },
            json: true
        }, function(err, resp) {
            assert(!err);
            assert.equal(resp.statusCode, HttpStatus.OK);

            done();
        });
    });

    it('can get all user visits', function(done) {
        request.get(`${visitsEndpoint}/${fixtures.userId}`, {
            headers: {
                Authorization: "Bearer " + fixtures.accessToken
            },
            json: true
        }, function(err, resp) {
            assert(!err);
            assert.equal(resp.statusCode, HttpStatus.OK);

            assert(resp.body.visits);
            assert(resp.body.visits.length > 0);

            done();
        });
    });
});
