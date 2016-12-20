"use strict"

const common = require('service-utils'),
      HttpStatus = require('http-status-codes'),
      services = require('../services');

exports.post = function(req, res) {
    services.visits.updateVisitsFromIntersection(req.body.intersection, err => {
        if (err) return common.utils.handleError(res, err);

        res.sendStatus(HttpStatus.ACCEPTED);
    });
};