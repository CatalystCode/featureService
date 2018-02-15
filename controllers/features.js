'use strict';

const
    common = require('service-utils'),
    services = require('../services');

exports.getById = function(req, res) {
    let query = {
        id: req.params.id.split(','),
        filter_namespace: req.query.filter_namespace,
        filter_layer: req.query.filter_layer,
        include: req.query.include
    };

    services.features.getById(query, (err, features) => {
        if (err) return common.utils.handleError(res, err);

        res.send({ 'features': features });
    });
};

exports.getByPoint = function(req, res) {
    let query = {
        latitude: parseFloat(req.params.latitude),
        longitude: parseFloat(req.params.longitude),
        filter_namespace: req.query.filter_namespace,
        filter_layer: req.query.filter_layer,
        include: req.query.include
    };

    if (req.query.layer) {
        query.layer = encodeURIComponent(req.query.layer);
    }

    services.features.getByPoint(query, (err, features) => {
        if (err) return common.utils.handleError(res, err);

        res.send({ 'features': features });
    });
};

exports.getByName = function(req, res) {
    let query = {
        name: req.params.name.split(/,(?=[^ ])/),
        filter_namespace: req.query.filter_namespace,
        filter_layer: req.query.filter_layer,
        include: req.query.include
    };

    if (req.query.layer) {
        query.layer = encodeURIComponent(req.query.layer);
    }

    services.features.getByName(query, (err, features) => {
        if (err) return common.utils.handleError(res, err);

        res.send({ 'features': features });
    });
};

exports.getByBoundingBox = function(req, res) {
    let query = {
        north: parseFloat(req.params.north),
        west: parseFloat(req.params.west),
        south: parseFloat(req.params.south),
        east: parseFloat(req.params.east),
        filter_name: req.query.filter_name,
        filter_namespace: req.query.filter_namespace,
        filter_layer: req.query.filter_layer,
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
