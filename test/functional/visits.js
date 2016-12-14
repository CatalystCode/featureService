"use strict"

const assert = require('assert');
const app = require('../../server');
const fixtures = require('../fixtures');
const HttpStatus = require('http-status-codes');
const presenters = require('../../presenters');
const request = require('request');

const visitsEndpoint = 'http://localhost:' + process.env.PORT + '/visits';

describe('visits endpoint', function() {
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
            assert.equal(resp.body.visits.length, 1);

            done();
        });
    });
});
