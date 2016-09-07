"use strict"

const assert = require('assert');
const app = require('../../server');
const fixtures = require('../fixtures');
const HttpStatus = require('http-status-codes');
const presenters = require('../../presenters');
const request = require('request');

const visitsEndpoint = 'http://localhost:' + process.env.PORT + '/visits';

describe('visits endpoint', function() {
    it('can get open visits', function(done) {
        request.get(`${visitsEndpoint}/open/747941cfb829`, {
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

    it('can upsert visit', function(done) {
        request.post(visitsEndpoint, {
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
            assert.equal(resp.statusCode, HttpStatus.ACCEPTED);

            done();
        });
    });
});
