"use strict"

const async = require('async'),
      common = require('service-utils'),
      HttpStatus = require('http-status-codes'),
      services = require('../services');

exports.get = function(req, res) {
    services.visits.getVisits(req.params.userId, {}, (err, visits) => {
        if (err) return common.utils.handleError(res, err);

        res.send({
            visits: visits
        });
    });
};