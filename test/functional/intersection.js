"use strict"

const assert = require('assert');
const app = require('../../server');
const fixtures = require('../fixtures');
const HttpStatus = require('http-status-codes');
const request = require('request');

const intersectionEndpoint = 'http://localhost:' + process.env.PORT + '/intersection';

describe('features endpoint', function() {
    it('can post intersection for processing', function(done) {
        request.post(intersectionEndpoint, {
            headers: {
                Authorization: "Bearer " + fixtures.accessToken
            },
            body: {
                intersections: [
                    fixtures.intersection
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