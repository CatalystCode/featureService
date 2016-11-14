'use strict';

let async = require('async'),
    fs = require('fs'),
    path = require('path'),
    services = require('../services'),
    Tile = require('geotile');

let DIRECTORY_PARALLELISM = 3;

let skipped = 0;
let total = 0;

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

        if (json['properties']['wof:belongsto'].length > 2) {
            return callback();
        }

        services.features.upsert(feature, (err, feature) => {
            if (err) {
                console.log(err);
                skipped += 1;

            } else {
                console.log(feature.names.common + ": " + file);
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
