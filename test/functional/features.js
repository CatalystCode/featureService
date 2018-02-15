"use strict"

const assert = require('assert'),
      app = require('../../server'),
      fixtures = require('../fixtures'),
      config = require('../../config'),
      HttpStatus = require('http-status-codes'),
      request = require('request');

const featuresEndpoint = 'http://localhost:' + config.port + '/features';

describe('features endpoint', function() {
    it('can get features within a boundingBox and layer', function(done) {
        request.get(`${featuresEndpoint}/bbox/16.829126675000003/-23.017646899999998/16.629126675000003/-22.817646899999998?layer=county&include=properties`, {
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
            assert(!feature.hull);

            done();
        });
    });

    it('can get features within a boundingBox', function(done) {
        request.get(`${featuresEndpoint}/bbox/16.829126675000003/-23.017646899999998/16.629126675000003/-22.817646899999998?include=properties`, {
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
            assert(!feature.hull);

            done();
        });
    });

    it('can get features intersected by a point', function(done) {
        request.get(`${featuresEndpoint}/point/16.729126675000003/-22.917646899999998?include=properties,hull`, {
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
            assert(feature.hull);

            done();
        });
    });

    it('can get features by name', function(done) {
        request.get(`${featuresEndpoint}/name/Sal's?include=properties,hull`, {
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
            assert(feature.hull);

            done();
        });
    });

    it('can get features by id', function(done) {
        request.get(`${featuresEndpoint}/id/fake-3830198`, {
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

            done();
        });
    });
});
