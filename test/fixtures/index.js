'use strict';

const uuid = require('node-uuid');

let fixtures = {
    feature: {
        "id":3830198,
        "names": {
            "common":"Sal"
        },
        "geometry": {
            "type":"MultiPolygon",
            "coordinates":[[[[-22.8724103,16.6696193],[-22.924919,16.585595],[-22.9840127,16.8273509],[-22.8892456,16.8339415],[-22.8724103,16.6696193]]]]
        },
        "centroid": {
            "type":"Point",
            "coordinates":[-22.917646899999998,16.729126675000003]
        },
        "category":"boundary",
        "tag":"administrative",
        "fullTag":"boundary:administrative",
        "adminLevel": 4
    },
    visit: {
        id: '93de94d6-6561-446f-9a33-c1761b029bd5',
        userId: '747941cfb829',
        featureId: 3830198,
        start: new Date(2016,4,19).getTime(),
    },
    location: {
        timestamp: new Date(2016,5,15),
        userId: '747941cfb829',
        accuracy: 10,
        altitude: 102,
        altitudeAccuracy: -1,
        course: 274.01,
        latitude: 41.7381279,
        longitude: -121.5290743,
        speed: 6.02
    },
    userId: '747941cfb829'
};

module.exports = fixtures;