"use strict"

const common = require('service-utils'),
      HttpStatus = require('http-status-codes'),
      services = require('../services');

exports.post = function(req, res) {
    services.features.intersectLocations(req.body.locations, (err, intersections) => {
        if (err) return common.utils.handleError(res, err);

        services.visits.updateVisitsFromIntersections(intersections, err => {
            if (err) return common.utils.handleError(res, err);

            res.send();
        });
    });
};
