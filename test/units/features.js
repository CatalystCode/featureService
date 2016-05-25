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
/*
    it('can get features by bounding box', function(done) {
        services.features.getByBoundingBox({
            north: 37,
            west: -123,
            south: 36,
            east: -122
        }, (err, features) => {
            assert(!err);
            assert(features);

            done();
        });
    });
*/

});