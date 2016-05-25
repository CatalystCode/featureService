"use strict"

let app = require('../server'),
    async = require('async'),
    common = require('service-utils'),
    fixtures = require('./fixtures'),
    services = require('../services');

before(function(done) {
    common.utils.waitForServiceStart(app, done);
});