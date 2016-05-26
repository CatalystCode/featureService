'use strict';

var async = require('async'),
    services = require('./services'),
    Tile = require('geotile');

let features = {};
let summaries = [];

services.init(function(err) {
    if (err) {
        return console.log('failed to initialize: ' + err);
        process.exit(1);
    }

    let tileIds = Tile.tileIdsForBoundingBox({
        north: 51.079403,
        west: 6.764754,
        south: 50.830260,
        east: 7.167815
    }, 17);

    // tileIds = tileIds.slice(0, 64);

    async.eachLimit(tileIds, 32, (tileId, tileCallback) => {
        let tile = Tile.tileFromTileId(tileId);

        services.features.summarizeByBoundingBox({
            north: tile.latitudeNorth,
            east: tile.longitudeEast,
            south: tile.latitudeSouth,
            west: tile.longitudeWest
        }, (err, summary) => {

            let tileSummary = {
                tileId: tileId
            };

            summary.forEach( (summaryFeature) => {
                features[summaryFeature.fulltag] = true;
                tileSummary[summaryFeature.fulltag] = parseInt(summaryFeature.count);
            });

            //console.dir(tileSummary);

            summaries.push(tileSummary);

            tileCallback();
        });
    }, (err) => {
        let featuresArray = Object.keys(features);
        console.log('# tileid,' + featuresArray.join(','));

        summaries.forEach( (summary) => {
            let summaryVector = summary.tileId;
            featuresArray.forEach( (featureKey) => {
                 if (!summary[featureKey])
                      summary[featureKey] = 0.0;

                 summaryVector += "," + summary[featureKey];
            });

            console.log(summaryVector);
        });
    });
});
