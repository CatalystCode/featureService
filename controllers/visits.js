"use strict"

const async = require('async'),
      common = require('service-utils'),
      HttpStatus = require('http-status-codes'),
      services = require('../services');

exports.get = function(req, res) {
    services.visits.getByUserId(req.params.userId, (err, visits) => {
        if (err) return common.utils.handleError(res, err);

        let visitResponse = services.visits.toResponse(visits);
        res.send(visitResponse);
    });
};

exports.put = function(req, res) {
    services.visits.fromRequest(req.body, function(err, visits) {
        if (err) return common.utils.handleError(res, err);

        services.visits.put(visits, err => {
            if (err) return common.utils.handleError(res, err);

            res.sendStatus(HttpStatus.OK);
        });
    });
};