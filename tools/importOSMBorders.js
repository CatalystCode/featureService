'use strict';

let async = require('async'),
    byline = require('byline'),
    fs = require('fs'),
    services = require('./services'),
    Tile = require('geotile'),
    turf = require('turf');

let count = 0;

let file = "./borders/simplified_admin_level_6.geojson";
let stream = byline(fs.createReadStream(file, {
    encoding: 'utf8'
}));

let features = [];
let importedCount = 0;

function addBorderLine(line) {
    let border = JSON.parse(line);

    let names = {};

    Object.keys(border.properties).forEach(key => {
        let firstFour = key.substr(0,4);
        if (key.substr(0, 4) === 'name') {
            let language = 'common';
            if (key.substr(4, 1) === ':') {
                language = key.substr(5);
            }
            names[language] = border.properties[key];
        }
    });

    let feature = {
        id: border.id,
        admin_level: border.properties.admin_level,
        names: names,
        geometry: border.geometry,
        centroid: turf.centroid(border).geometry,
        category: 'boundary',
        tag: border.properties['boundary'],
        fullTag: 'boundary:' + border.properties['boundary']
    };

    features.push(feature);
}

function upsertBorders() {
    async.eachLimit(features, 30, (feature, featureCallback) => {
        services.features.upsert(feature, err => {
            if (err) console.log(err);

            importedCount += 1;

            if (importedCount % 500 === 0)
                console.log(importedCount);

            featureCallback();
        });
    }, err => {
        console.log(err);
        process.exit(0);
    });
}

services.init(function(err) {
    if (err) {
        return common.services.log.error('failed to initialize: ' + err);
        process.exit(1);
    }

    stream.on('data', addBorderLine);
    stream.on('end', upsertBorders);
});
