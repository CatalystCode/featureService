"use strict"

const async = require('async'),
      common = require('service-utils'),
      HttpStatus = require('http-status-codes'),
      services = require('../services');

exports.get = function(req, res) {
    services.visits.getVisits(req.params.scope, req.params.userId, (err, visits) => {
        if (err) return common.utils.handleError(res, err);

        res.send({
            visits: visits
        });
    });
};

exports.upsert = function(req, res) {
    services.visits.fromJson(req.body, function(err, visits) {
        if (err) return common.utils.handleError(res, err);

        //visits.forEach(visit => visit.userId = req.user.id);

        async.each(visits, services.visits.upsert, err => {
            if (err) return common.utils.handleError(res, err);

            res.sendStatus(HttpStatus.ACCEPTED);
        });
    });
};