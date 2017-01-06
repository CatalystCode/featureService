'use strict';

let async = require('async'),
    request = require('request'),
    Tile = require('geotile');

request.get(`http://localhost:3032/bbox/34.608/9.07/19.938716/19.938716`, {
    json: true
}, function(err, resp, body) {
    body.features.forEach(feature => {

        let latitude = feature.centroid.coordinates[1];
        let longitude = feature.centroid.coordinates[0];

        let tileIds = [];
        for (let zoomLevel=4; zoomLevel <= 16; zoomLevel++) {
            let tileId = Tile.tileIdFromLatLong(latitude, longitude, zoomLevel);
            tileIds.push(tileId);
        }

        let outputFeature = {
            names: feature.names,
            adminLevel: feature.adminLevel,
            border: feature.hull,
            centroid: feature.centroid,
            tileIds: tileIds
        };

        console.log(JSON.stringify(outputFeature));
    });
});
