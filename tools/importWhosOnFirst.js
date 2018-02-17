'use strict';

let async = require('async'),
    fs = require('fs'),
    path = require('path'),
    services = require('../services'),
    Tile = require('geotile');

const DIRECTORY_PARALLELISM = 3;

let skipped = 0;
let total = 0;

const skipIds = [
  0,
  1
];

let keepIds = [
];

const ignoreTypes = [
    /*
    'locality',
    'localadmin',
    'macrohood',
    'microhood',
    'neighbourhood',
    */
    'marinearea',
    'ocean',
    'planet',
    'postalcode',
    'timezone',
];

let foundTypes = {};

const DEFAULT_PLACETYPE_ZOOM = {
    /*
    locality:       { min: 14, max: 18 },
    macrohood:      { min: 14, max: 18 },
    microhood:      { min: 14, max: 19 },
    neighborhood:   { min: 15, max: 18 },
    */
};

function processFile(file, callback) {
    fs.readFile(file, (err, data) => {
        if (err) return callback(err);

        total += 1;

        let json;
        try {
            json = JSON.parse(data);
        } catch(e) {
            console.log('failed to parse: ' + file);
            skipped += 1;
            return callback();
        }

        if (!json["bbox"] || (json['bbox'][0] === 0.0 && json['bbox'][1] === 0.0 && json['bbox'][2] === 0.0 && json['bbox'][3] === 0)) {
            console.log('no bbox, skipping: ' + file);
            skipped += 1;
            return callback();
        }

        let properties = json['properties'];

        if (!properties["wof:name"]) {
            console.log('no name, skipping: ' + file);
            skipped += 1;
            return callback();
        }

        if (skipIds.indexOf(json.id) !== -1) {
            console.log(json.id + ' is in skip list, skipping.');
            skipped += 1;
            return callback();
        }

        let placeType = properties['wof:placetype'];

        if (ignoreTypes.indexOf(placeType) !== -1) {
            skipped += 1;
            return callback();
        }

        if (total % 1000 === 0)
            console.log(`${skipped}/${total}`);

        let feature = {
            id: `wof-${json.id}`,
            name: properties['wof:name'],
            layer: placeType,
            centroid: {
                "type":"Point",
                "coordinates":[
                    properties['geom:longitude'],
                    properties['geom:latitude']
                ]
            },
            hull: json['geometry'],
            properties: {
                names: {
                    'en': properties['wof:name']
                },
                tags: [
                    "boundary:administrative",
                    `placetype:${placeType}`
                ]
            }
        };

        feature.properties.hierarchy = [];
        if (properties['wof:hierarchy'] && properties['wof:hierarchy'].length > 0) {
            let hierarchy = properties['wof:hierarchy'][0]
            Object.keys(hierarchy).forEach(level => {
                feature.properties.hierarchy.push(
                    `wof-${hierarchy[level]}`
                );
            });

            //console.log(feature.properties.hierarchy);
        }

        if (properties['gn:population']) {
            feature.properties.population = properties['gn:population'];
        }

/*
        if (properties['mz:min_zoom'] && properties['mz:max_zoom']) {
            feature.minZoom = properties['mz:min_zoom'];
            feature.maxZoom = properties['mz:max_zoom'];

            if (!DEFAULT_PLACETYPE_ZOOM[placeType]) {
                DEFAULT_PLACETYPE_ZOOM[placeType] = {
                    min: 0.0,
                    max: 0.0,
                    count: 0.0
                }
            }
            DEFAULT_PLACETYPE_ZOOM[placeType].min += properties['mz:min_zoom'];
            DEFAULT_PLACETYPE_ZOOM[placeType].max += properties['mz:max_zoom'];
            DEFAULT_PLACETYPE_ZOOM[placeType].count += 1;
        } else {
            feature.minZoom = DEFAULT_PLACETYPE_ZOOM[placeType].min;
            feature.maxZoom = DEFAULT_PLACETYPE_ZOOM[placeType].max;
        }

        for (let placeType in DEFAULT_PLACETYPE_ZOOM) {
            let minValue = DEFAULT_PLACETYPE_ZOOM[placeType].min / DEFAULT_PLACETYPE_ZOOM[placeType].count;
            let maxValue = DEFAULT_PLACETYPE_ZOOM[placeType].max / DEFAULT_PLACETYPE_ZOOM[placeType].count;

            console.log(`${placeType}: min: ${minValue} max: ${maxValue}`)
        }
*/
        // let squareKm = turf.area(feature.hull) / 1000000.0;
/*
        if (placeType === "county" && (!feature.hierarchy || feature.hierarchy['country_id'] !== 85633793)) {
            skipped += 1;
            return callback();
        }
*/

/*
        delete feature['hull'];
        console.log(JSON.stringify(feature, null, 2));
        return callback();
*/

        services.features.upsert(feature, err => {
            if (err) {
                console.log(err);
                skipped += 1;

            } else {
                console.log(placeType + ": " + feature.id + ": " + feature.name + ": " + file.slice(58));
            }

            return callback();
        });
    });
}

function processDirectory(dir, callback) {
    fs.readdir(dir, (err, files) => {
        if (err) return done(err);

        async.eachLimit(files, DIRECTORY_PARALLELISM, (filename, fileCallback) => {
            let file = path.resolve(dir, filename);
            fs.stat(file, (err, stat) => {
                if (stat && stat.isDirectory()) {
                    processDirectory(file, fileCallback);
                } else {
                    processFile(file, fileCallback);
                }
            });
        }, callback);
    });
};

services.init(err => {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    processDirectory('./whosonfirst-data/data', (err) => {
        console.log('finished with error: ' + err);
        process.exit(0);
    });
});
