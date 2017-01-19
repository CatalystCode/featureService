"use strict"

const common = require('service-utils'),
      HttpStatus = require('http-status-codes'),
      services = require('../services');

exports.post = function(req, res) {
    let parsedLocations = req.body.locations.map(location => {
        location.timestamp = new Date(Date.parse(location.timestamp));
        return location;
    });

    services.features.intersectLocations(parsedLocations, (err, intersections) => {
        if (err) return common.utils.handleError(res, err);

        services.visits.updateVisitsFromIntersections(intersections, err => {
            if (err) return common.utils.handleError(res, err);

            res.sendStatus(HttpStatus.OK);
        });
    });
};