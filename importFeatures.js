'use strict';

var pbf2json = require('pbf2json'),
    through = require('through2'),
    services = require('./services');

let featureTags = [
  'amenity',
  'leisure',
  'public_transport'
];

let config = {
    file: process.env.OSM_FILE,
    tags: featureTags,
    leveldb: process.env.LEVELDB_DIR
};

let count = 0;

console.log('initing services');

services.init(function(err) {
    if (err) {
        return common.services.log.error('failed to initialize: ' + err);
        process.exit(1);
    }

    console.log('services inited');

    pbf2json.createReadStream(config).pipe(
        through.obj( (item, e, next) => {

          let feature = {
              id: item.id
          };

          /*
          if (item.tags.name)
              feature.name = item.tags.name;
          */

          featureTags.forEach( (featureTag) => {
              if (!item.tags[featureTag]) return;

              feature.category = featureTag;
              feature.fullTag = `${featureTag}:${item.tags[featureTag]}`;
              feature.tag = item.tags[featureTag];
          });

          if (item.type === 'node') {
              feature.centroid = {
                  lat: item.lat,
                  lon: item.lon
              };
          }

          if (item.type === 'way') {
              feature.centroid = item.centroid;
              console.dir(feature);
          }

          services.features.upsert(feature, (err, feature) => {
              if (err) return console.log(err);

              count += 1;
              if (count % 100 === 0)
                  console.log('count: ' + count);

              next();
          });

        })
    );
});
