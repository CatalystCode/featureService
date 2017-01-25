'use strict';

const async = require('async'),
      farmhash = require('farmhash'),
      fs = require('fs'),
      services = require('../services'),
      turf = require('turf');

let rhomFeatures = {};

services.init(err => {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    fs.readFile('data/ca-state-parks.json', 'utf8', (err, json) => {
        if (err) {
            console.log('err: ' + err);
            process.exit(0);
        }

        let featureCollections = JSON.parse(json);
        async.eachSeries(featureCollections, (featureCollection, featureCollectionCallback) => {
            async.eachLimit(featureCollection.features, 4, (feature, featureCallback) => {
                let name = feature.properties.UNITNAME;
                let idHash = farmhash.hash32(name);
                let id = `casp-${idHash}`;

                if (!rhomFeatures[id]) {
                    rhomFeatures[id] = {
                        id,
                        layer: 'park',
                        name: name,
                        properties: {
                            names: {
                                en: name
                            },
                            tags: ['boundary:protected_area']
                        },
                        count: 1,
                        hull: feature.geometry
                    };
                } else {
                    var fc = {
                        "type": "FeatureCollection",
                        "features": [{
                            "type": "Feature",
                            "properties": {},
                            "geometry": rhomFeatures[id].hull
                        }, {
                            "type": "Feature",
                            "properties": {},
                            "geometry": feature.geometry
                        }]
                    };

                    let combined = turf.combine(fc);
                    rhomFeatures[id].count += 1;
                    rhomFeatures[id].hull = combined.features[0].geometry;
                }

                return featureCallback();
            }, featureCollectionCallback);
        }, err => {
            if (err) {
                console.log(err);
                process.exit();
            }

            async.eachLimit(Object.keys(rhomFeatures), 4, (featureId, featureCallback) => {
                console.log(featureId + ": " + rhomFeatures[featureId].name);
                services.features.upsert(rhomFeatures[featureId], featureCallback);
            }, process.exit);
        });
    });
});