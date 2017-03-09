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

    it('can get intersecting features by point', function(done) {
        services.features.getByPoint({
            latitude: 16.729126675,
            longitude: -22.9176469,
            include: "properties"
        }, (err, features) => {
            assert(!err);

            assert(features);
            assert(features.length > 0);

            assert.equal(features[0].properties.tags[0], fixtures.feature.properties.tags[0]);

            done();
        });
    });

    it('can get features by bounding box', function(done) {
        services.features.getByBoundingBox({
            north: 17,
            west: -23,
            south: 16,
            east: -22,
            include: "properties"
        }, (err, features) => {
            assert(!err);
            assert(features);

            assert(features.length > 0);

            assert.equal(features[0].properties.tags[0], fixtures.feature.properties.tags[0]);

            done();
        });
    });
});
