"use strict"

const assert = require('assert');
const app = require('../../server');
const fixtures = require('../fixtures');
const HttpStatus = require('http-status-codes');
const request = require('request');

const intersectionEndpoint = 'http://localhost:' + process.env.PORT + '/intersections';

describe('features endpoint', function() {
    it('can post intersections for visit processing', function(done) {
        request.post(intersectionEndpoint, {
            headers: {
                Authorization: "Bearer " + fixtures.accessToken
            },
            body: {
                intersections: fixtures.intersections
            },
            json: true
        }, function(err, resp) {
            assert(!err);
            assert.equal(resp.statusCode, HttpStatus.OK);

            done();
        });
    });

    /*
    it('can post locations for visit processing', function(done) {
        request.post(intersectionEndpoint, {
            headers: {
                Authorization: "Bearer " + fixtures.accessToken
            },
            body: {
                locations: fixtures.locations
            },
            json: true
        }, function(err, resp) {
            assert(!err);
            assert.equal(resp.statusCode, HttpStatus.OK);

            done();
        });
    });
    */
});