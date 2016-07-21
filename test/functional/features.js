"use strict"

const assert = require('assert');
const app = require('../../server');
const fixtures = require('../fixtures');
const HttpStatus = require('http-status-codes');
const presenters = require('../../presenters');
const request = require('request');

const featuresEndpoint = 'http://localhost:' + process.env.PORT + '/features';

describe('features endpoint', function() {
    it('can get features within a boundingBox', function(done) {
        request.get(`${featuresEndpoint}/-49.4979793/-45.9793523/-49.4999793/-45.9773523`, {
            headers: {
                Authorization: "Bearer " + fixtures.accessToken
            },
            json: true
        }, function(err, resp) {
            assert(!err);
            assert.equal(resp.statusCode, HttpStatus.OK);

            assert(resp.body.features);
            assert.equal(resp.body.features.length, 1);
            assert.equal(resp.body.features[0].category, 'leisure');
            assert.equal(resp.body.features[0].tag, 'playground');
            assert.equal(resp.body.features[0].centroid.coordinates[0], -45.9783523);
            assert.equal(resp.body.features[0].centroid.coordinates[1], -49.4989793);

            done();
        });
    });
});
