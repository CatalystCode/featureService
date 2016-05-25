var assert = require('assert')
  , app = require('../../server')
  , HttpStatus = require('http-status-codes')
  , request = require('request');

var opsEndpoint = 'http://localhost:' + process.env.PORT + '/ops';

describe('ops endpoint', function() {
    it('can report health', function(done) {
        request.get(opsEndpoint + "/health", {
            json: true
        }, function(err, resp) {
            assert(!err);
            assert.equal(resp.statusCode, HttpStatus.OK);
            assert.equal(resp.body.ok, true);
            done();
        });
    });
});