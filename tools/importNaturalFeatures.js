'use strict';

let pbf2json = require('pbf2json'),
    services = require('../services'),
    config = require('../config'),
    through = require('through2'),
    Tile = require('geotile');

const FULL_TAGS_TO_CAPTURE = [
  'building:hut',
/*
  'historic:boundary_stone',
  'historic:castle',
  'historic:monument',
  'historic:milestone',
  'historic:rune_stone',
  'man_made:beacon',
*/
  'natural:saddle',
  'natural:peak',
  'natural:volcano',
/*
  'iata:*',
  'tourism:artwork',
*/
  'tourism:alpine_hut',
  'tourism:wilderness_hut',
/*
  'tourism:viewpoint'
*/
];

const FEATURE_TAGS = [
  'aeroway',
  'building',
  'historic',
  'iata',
  'man_made',
  'natural',
  'tourism'
];

let config = {
    file: config.osmFile,
    tags: FEATURE_TAGS
};

let count = 0;
services.init(function(err) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    console.log('init finished, starting');

    pbf2json.createReadStream(config).pipe(
        through.obj( (item, e, next) => {
            let feature = {
                id: `osm-${item.id}`,
                layer: 'osm',
                properties: {
                    names: {},
                    tags: []
                }
            };
            count += 1;
            if (count % 100 === 0) console.log(count);

            FEATURE_TAGS.forEach(featureTag => {
                if (!item.tags[featureTag]) return;

                feature.properties.tags.push(`${featureTag}:${item.tags[featureTag]}`);
            });

            let foundMatching = false;
            feature.properties.tags.forEach(tag => {
                foundMatching = foundMatching || FULL_TAGS_TO_CAPTURE.indexOf(tag) >= 0;
            });

            if (!foundMatching) {
                console.log('no matching tag ' + JSON.stringify(feature.properties.tags) + ' for feature, skipping.');
                return next();
            }
            if (!item.tags['name']) {
                console.log('no name on matching feature, skipping.');
                return next();
            }

            feature.name = feature.properties.names['en'] = item.tags['name'];

            if (item.type === 'node') {
                let latitude = parseFloat(item.lat);
                let longitude = parseFloat(item.lon);

                feature.centroid = {
                    "type":"Point",
                    "coordinates":[
                        longitude,
                        latitude
                    ]
                };

                let bboxDelta = 0.001;
                feature.hull = {
                    "type":"Polygon",
                    "coordinates":[[
                        [longitude - bboxDelta, latitude + bboxDelta],
                        [longitude + bboxDelta, latitude + bboxDelta],
                        [longitude + bboxDelta, latitude - bboxDelta],
                        [longitude - bboxDelta, latitude - bboxDelta],
                        [longitude - bboxDelta, latitude + bboxDelta]
                    ]]
                };

                if (item.tags['ele']) {
                    feature.properties.elevation = parseFloat(item.tags['ele']);
                }
            }
/*
            if (item.type === 'way') {
                feature.centroid = item.centroid;
                feature.hull = item.nodes;
            }
*/

            let featureJson = JSON.stringify(feature);
            console.log(featureJson);

            services.features.upsert(feature, (err, feature) => {
                if (err) console.log(err);
                next();
            });
        })
    ).on('finish', () => {
        console.log('finished');
        setTimeout(process.exit, 5000);
    });
});
