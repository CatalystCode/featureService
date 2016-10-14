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
        request.get(`${featuresEndpoint}/bbox/16.829126675000003/-23.017646899999998/16.629126675000003/-22.817646899999998`, {
            headers: {
                Authorization: "Bearer " + fixtures.accessToken
            },
            json: true
        }, function(err, resp) {
            assert(!err);
            assert.equal(resp.statusCode, HttpStatus.OK);

            assert(resp.body.features);
            assert.equal(resp.body.features.length, 17);
            assert.equal(resp.body.features[0].category, 'boundary');
            assert.equal(resp.body.features[0].tag, 'administrative');
            assert(resp.body.features[0].centroid.coordinates);

            done();
        });
    });

    it('can get features intersected by a point', function(done) {
        request.get(`${featuresEndpoint}/point/16.729126675000003/-22.917646899999998`, {
            headers: {
                Authorization: "Bearer " + fixtures.accessToken
            },
            json: true
        }, function(err, resp) {
            assert(!err);
            assert.equal(resp.statusCode, HttpStatus.OK);

            assert(resp.body.features);

            assert.equal(resp.body.features.length, 6);
            assert.equal(resp.body.features[0].category, 'boundary');
            assert.equal(resp.body.features[0].tag, 'administrative');
            assert.equal(resp.body.features[0].centroid.coordinates[0], 0.0);
            assert.equal(resp.body.features[0].centroid.coordinates[1], 0.0);

            done();
        });
    });
});
