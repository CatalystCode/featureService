"use strict"

const common = require('service-utils'),
      HttpStatus = require('http-status-codes'),
      services = require('../services');

exports.post = function(req, res) {
    common.services.log.info('intersection received: ' + JSON.stringify(req.body.intersection, null, 2));
    services.visits.updateVisitsFromIntersection(req.body.intersection, err => {
        if (err) return common.utils.handleError(res, err);

        res.sendStatus(HttpStatus.ACCEPTED);
    });
};