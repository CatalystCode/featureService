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

exports.getByPoint = function(req, res) {
    let query = {
        latitude: parseFloat(req.params.latitude),
        longitude: parseFloat(req.params.longitude),
    };

    if (req.query.layer) {
        query.layer = encodeURIComponent(req.query.layer);
    }

    services.features.getByPoint(query, (err, features) => {
        if (err) return common.utils.handleError(res, err);

        let simplifiedFeatures = features.map(feature => {
            delete feature['hull'];
            return feature;
        });

        res.send({
            features: simplifiedFeatures
        });
    });
};

exports.getByBoundingBox = function(req, res) {
    let query = {
        north: parseFloat(req.params.north),
        west: parseFloat(req.params.west),
        south: parseFloat(req.params.south),
        east: parseFloat(req.params.east),
    };

    if (req.query.layer) {
        query.layer = encodeURIComponent(req.query.layer);
    }

    services.features.getByBoundingBox(query, (err, features) => {
        if (err) return common.utils.handleError(res, err);

        res.send({
            features: features
        });
    });
};