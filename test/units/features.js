"use strict"

var app = require('../../server')
  , assert = require('assert')
  , fixtures = require('../fixtures')
  , services = require('../../services');

describe('features service', function() {

    it('can upsert node feature', function(done) {
        services.features.upsert(fixtures.nodeFeature, (err, feature) => {
            console.log(err);
            assert(!err);
            assert(feature);

            done();
        });
    });

    it('can upsert way feature', function(done) {
        services.features.upsert(fixtures.wayFeature, (err, feature) => {
            assert(!err);
            assert(feature);

            done();
        });
    });

    it('can summarize features by bounding box', function(done) {
        services.features.summarizeByBoundingBox({
            north: -49.4979793,
            west: -45.9793523,
            south: -49.4999793,
            east: -45.9773523
        }, (err, summaries) => {
            assert(!err);
            assert.equal(summaries.length, 1);
            assert.equal(summaries[0].fulltag, 'leisure:playground');
            assert.equal(summaries[0].count, 1);

            done();
        });
    });

    it('can get intersecting features by point', function(done) {
        services.features.getByPoint({
            latitude: -49.4989792,
            longitude: -45.9783524
        }, (err, features) => {
            assert(!err);
            assert(features);

            assert.equal(features.length, 1);
            assert.equal(features[0].tag, 'playground');
            assert.equal(features[0].centroid.coordinates[0], -45.9783523);
            assert.equal(features[0].centroid.coordinates[1], -49.4989793);

            done();
        });
    });

    it('can get features by bounding box', function(done) {
        services.features.getByBoundingBox({
            north: -49.4979793,
            west: -45.9793523,
            south: -49.4999793,
            east: -45.9773523
        }, (err, features) => {
            assert(!err);
            assert(features);

            assert.equal(features.length, 1);
            assert.equal(features[0].tag, 'playground');
            assert.equal(features[0].centroid.coordinates[0], -45.9783523);
            assert.equal(features[0].centroid.coordinates[1], -49.4989793);

            done();
        });
    });

});