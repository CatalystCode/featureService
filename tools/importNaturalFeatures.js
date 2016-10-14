'use strict';

let pbf2json = require('pbf2json'),
    services = require('../services'),
    through = require('through2'),
    Tile = require('geotile');

const FULL_TAGS_TO_CAPTURE = [
    /*
  'building:hut',
  'historic:boundary_stone',
  'historic:castle',
  'historic:monument',
  'historic:milestone',
  'historic:rune_stone',
  'man_made:beacon',
  */
  'natural:peak',
/*
  'iata:*',
  'tourism:artwork',
  'tourism:alpine_hut',
  'tourism:wilderness_hut',
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
    file: process.env.OSM_FILE,
    tags: FEATURE_TAGS
};

let count = 0;
/*
services.init(function(err) {
    if (err) {
        console.log(err);
//        return services.log.error('failed to initialize: ' + err);
        process.exit(1);
    }
*/
    pbf2json.createReadStream(config).pipe(
        through.obj( (item, e, next) => {
            let feature = {
                id: `'osm-${item.id}'`
            };

            if (!item.tags['name']) return;

            FEATURE_TAGS.forEach( (featureTag) => {
                if (!item.tags[featureTag]) return;

                feature.category = featureTag;
                feature.tag = item.tags[featureTag];
                feature.fullTag = `${featureTag}:${item.tags[featureTag]}`;
            });

            if (FULL_TAGS_TO_CAPTURE.indexOf(feature.fullTag) < 0)
                return next();

            feature.names = {};

            feature.names.common = item.tags['name'];

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
                    feature.elevation = parseFloat(item.tags['ele']);
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
// });
