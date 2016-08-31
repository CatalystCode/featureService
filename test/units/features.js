"use strict"

var app = require('../../server')
  , assert = require('assert')
  , fixtures = require('../fixtures')
  , services = require('../../services');

describe('features service', function() {

    it('can upsert feature', function(done) {
        services.features.upsert(fixtures.feature, (err, feature) => {
            console.log(err);
            assert(!err);
            assert(feature);

            done();
        });
    });

    it('can summarize features by bounding box', function(done) {
        services.features.summarizeByBoundingBox({
            north: 16.829126675000003,
            west: -23.017646899999998,
            south: 16.629126675000003,
            east: -22.817646899999998
        }, (err, summaries) => {
            assert(!err);
            assert.equal(summaries.length, 1);
            assert.equal(summaries[0].fulltag, 'boundary:administrative');
            assert.equal(summaries[0].count, 1);

            done();
        });
    });

    it('can get intersecting features by point', function(done) {
        services.features.getByPoint({
            latitude: 16.729126675000003,
            longitude: -22.917646899999998
        }, (err, features) => {
            assert(!err);
            assert(features);

            assert.equal(features.length, 1);
            assert.equal(features[0].tag, 'administrative');
            assert.equal(features[0].centroid.coordinates[0], -22.9176469);
            assert.equal(features[0].centroid.coordinates[1], 16.729126675);

            done();
        });
    });

    it('can get features by bounding box', function(done) {
        services.features.getByBoundingBox({
            north: 16.829126675000003,
            west: -23.017646899999998,
            south: 16.629126675000003,
            east: -22.817646899999998
        }, (err, features) => {
            assert(!err);
            assert(features);

            assert.equal(features.length, 1);
            assert.equal(features[0].tag, 'administrative');
            assert.equal(features[0].centroid.coordinates[0], -22.9176469);
            assert.equal(features[0].centroid.coordinates[1], 16.729126675);

            done();
        });
    });

});