"use strict"

var app = require('../../server')
  , assert = require('assert')
  , fixtures = require('../fixtures')
  , services = require('../../services');

describe('features service', function() {

    it('can upsert feature', function(done) {
        services.features.upsert(fixtures.feature, (err, feature) => {
            assert(!err);
            assert(feature);

            done();
        });
    });

    it('can summarize features by bounding box', function(done) {
        services.features.summarizeByBoundingBox({
            north: 37.096292,
            west: -122.144374,
            south: 36.961995,
            east: -121.817531
        }, (err, summaries) => {
            assert(!err);

            assert(summaries.length > 0);
            assert.equal(summaries[0].fulltag, 'natural:peak');
            assert.equal(summaries[0].count, 31);

            done();
        });
    });

    it('can get intersecting features by point', function(done) {
        services.features.getByPoint({
            latitude: 36.5785,
            longitude: -118.2923
        }, (err, features) => {
            assert(!err);
            assert(features);

            assert(features.length > 0);

            assert.equal(features[0].fulltag, 'boundary:administrative');
            assert.equal(features[0].centroid.coordinates[0], 0.0);
            assert.equal(features[0].centroid.coordinates[1], 0.0);

            assert.equal(features[7].fulltag, 'natural:peak');
            assert(features[7].centroid.coordinates);

            done();
        });
    });

    it('can get features by bounding box', function(done) {
        services.features.getByBoundingBox({
            north: 37.096292,
            west: -122.144374,
            south: 36.961995,
            east: -121.817531
        }, (err, features) => {
            assert(!err);
            assert(features);

            assert(features.length > 0);

            assert.equal(features[0].fulltag, 'natural:peak');
            assert(features[0].centroid.coordinates);

            done();
        });
    });

});