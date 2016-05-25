"use strict"

const assert = require('assert');
const app = require('../../server');
const fixtures = require('../fixtures');
const HttpStatus = require('http-status-codes');
const presenters = require('../../presenters');
const request = require('request');

const featuresEndpoint = 'http://localhost:' + process.env.PORT + '/features';

describe('features endpoint', function() {

/*
    it('can GET an activity', function(done) {
        request.get(`${featuresEndpoint}/${activityId}`, {
            headers: {
                Authorization: "Bearer " + fixtures.accessToken
            },
            json: true
        }, function(err, resp) {
            assert(!err);
            assert.equal(resp.statusCode, HttpStatus.OK);

            assert(resp.body.data);

            done();
        });
    });
*/
/*
    it('can get features within a boundingBox', function(done) {
        request.get(`${featuresEndpoint}/37/-123/36/-122`, {
            headers: {
                Authorization: "Bearer " + fixtures.accessToken
            },
            json: true
        }, function(err, resp) {
            assert(!err);
            assert.equal(resp.statusCode, HttpStatus.OK);

            assert(resp.body.activities);
            assert(resp.body.activities.length > 0);
            assert(resp.body.activities[0].d !== undefined);
            assert(resp.body.activities[0].td !== undefined);
            assert(resp.body.activities[0].l !== undefined);
            assert(resp.body.activities[0].g !== undefined);
            assert(resp.body.activities[0].id !== undefined);

            done();
        });
    });
*/

});
