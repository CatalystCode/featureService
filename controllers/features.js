"use strict"

const common = require('service-utils'),
      HttpStatus = require('http-status-codes'),
      services = require('../services');

/*
exports.upsert = function(req, res) {
    services.features.fromJsonApi(req.body, function(err, activity) {
        if (err) return common.utils.handleError(res, err);

        services.features.create(features, function(err) {
            if (err) return common.utils.handleError(res, err);

            services.features.toJsonApi(feature, function(featureJson) {
                res.send(activityJson);
            });
        });
    });
};

exports.get = function(req, res) {
    services.activities.get(req.params.userId, req.params.activityId, function(err, activity) {
        if (err) return common.utils.handleError(res, err);

        services.activities.toJsonApi(activity, function(err, activityJson) {
            if (err) return common.utils.handleError(res, err);
            res.send(activityJson);
        });
    });
};
*/

exports.getByBoundingBox = function(req, res) {
    services.features.getByBoundingBox({
        north: req.params.north,
        west: req.params.west,
        south: req.params.south,
        east: req.params.east
    }, (err, features) => {
        if (err) return common.utils.handleError(res, err);

        res.send({
            features: features
        });
    });
};