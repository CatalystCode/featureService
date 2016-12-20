'use strict';

let async = require('async'),
    fs = require('fs'),
    path = require('path'),
    services = require('../services'),
    Tile = require('geotile'),
    turf = require('turf');

let DIRECTORY_PARALLELISM = 3;

let skipped = 0;
let total = 0;

let skipIds = [
  '0',
  '1',
  '85788865',
  '85880723',
  '85880767',
  '85886313',
  '85888131',
  '404529565',
  '404528711',
  '420551843',
  '420552373',
  '420552465',
  '420552969',
  '420553211',
];

let keepIds = [

];

let ignoreTypes = [
    'locality',
    'localadmin',
    'marinearea',
    'macrohood',
    'microhood',
    'neighbourhood',
    'ocean',
    'planet',
    'postalcode',
    'timezone',
];


let countyCountries = [
    85633793
];

let foundTypes = {};

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
            //console.log('no bbox, skipping: ' + file);
            skipped += 1;
            return callback();
        }

        if (!json["properties"]["wof:name"]) {
            //console.log('no name, skipping: ' + file);
            skipped += 1;
            return callback();
        }

        if (json["properties"]["wof:placetype"] === "timezone") {
            skipped += 1;
            return callback();
        }

        if (total % 1000 === 0)
            console.log(`${skipped}/${total}`);

        let feature = {
            id: `'wof-${json.id}'`,
            centroid: {
                "type":"Point",
                "coordinates":[
                    json['properties']['geom:longitude'],
                    json['properties']['geom:latitude']
                ]
            },
            hull: json['geometry'],
            originalGeometry: json['geometry'],
            fullTag: "boundary:administrative",
            category: "boundary",
            tag: "admin",
            names: {
                common: json['properties']['wof:name']
            }
        };

        if (json['properties']['wof:hierarchy']) {
            feature.hierarchy = json['properties']['wof:hierarchy'][0];
        }

        let placeType = json['properties']['wof:placetype'];
        let squareKm = turf.area(feature.hull) / 1000000.0;

        if (skipIds.indexOf(json.id) !== -1) {
            console.log(json.id + ' is in kill list, skipping.');
            skipped += 1;
            return callback();
        }

        if (ignoreTypes.indexOf(placeType) !== -1) {
            skipped += 1;
            return callback();
        }

        if (placeType === "county" && (!feature.hierarchy || feature.hierarchy['country_id'] !== 85633793)) {
            skipped += 1;
            return callback();
        }

//        if (!foundTypes[placeType]) {
//            console.log(placeType + ": " + json['properties']['wof:name']);
//            foundTypes[placeType] = true;
//        }

//        if (json['properties']['wof:belongsto'].length > 2) {
//            return callback();
//        }

        services.features.upsert(feature, (err, feature) => {
            if (err) {
                console.log(err);
                skipped += 1;

            } else {
                console.log(placeType + ": " + feature.id + ": " + feature.names.common + ": " + squareKm + ": " + file.slice(58));
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
