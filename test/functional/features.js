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
            assert(resp.body.features.length > 0);

            let feature = resp.body.features[0];

            assert.equal(feature.id, fixtures.feature.id);
            assert.equal(feature.name, fixtures.feature.name);
            assert.equal(feature.layer, fixtures.feature.layer);
            assert.equal(feature.properties.tags[0], fixtures.feature.properties.tags[0]);
            assert(feature.centroid.coordinates);

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
            assert(resp.body.features.length > 0);

            let feature = resp.body.features[0];

            assert.equal(feature.id, fixtures.feature.id);
            assert.equal(feature.name, fixtures.feature.name);
            assert.equal(feature.layer, fixtures.feature.layer);
            assert.equal(feature.properties.tags[0], fixtures.feature.properties.tags[0]);
            assert(feature.centroid.coordinates);
            assert.equal(resp.body.features[0].centroid.coordinates[0], -22.9176469);
            assert.equal(resp.body.features[0].centroid.coordinates[1], 16.729126675);

            done();
        });
    });
});
