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
*/

exports.getById = function(req, res) {
    let query = {
        id: req.params.id.split(','),
        include: req.query.include
    };

    services.features.getById(query, (err, features) => {
        if (err) return common.utils.handleError(res, err);

        res.send({ "features": features });
    });
};

exports.getByPoint = function(req, res) {
    let query = {
        latitude: parseFloat(req.params.latitude),
        longitude: parseFloat(req.params.longitude),
        include: req.query.include
    };

    if (req.query.layer) {
        query.layer = encodeURIComponent(req.query.layer);
    }

    services.features.getByPoint(query, (err, features) => {
        if (err) return common.utils.handleError(res, err);

        res.send({ "features": features });
    });
};

exports.getByName = function(req, res) {
    let query = {
        name: req.params.name.split(','),
        include: req.query.include
    };

    if (req.query.layer) {
        query.layer = encodeURIComponent(req.query.layer);
    }

    services.features.getByName(query, (err, features) => {
        if (err) return common.utils.handleError(res, err);

        res.send({ "features": features });
    });
};

exports.getByBoundingBox = function(req, res) {
    let query = {
        north: parseFloat(req.params.north),
        west: parseFloat(req.params.west),
        south: parseFloat(req.params.south),
        east: parseFloat(req.params.east),
        include: req.query.include
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