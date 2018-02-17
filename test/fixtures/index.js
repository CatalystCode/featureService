'use strict';

let fixtures = {
    feature: {
        "id": "fake-3830198",
        "name": "Sal's",
        "layer": "county",
        "properties": {
            "names": {
                "en":"Sal's"
            },
            "tags": [
                "boundary:administrative",
                "placetype:county"
            ],
            "elevation": 34.5
        },
        "hull": {
            "type":"MultiPolygon",
            "coordinates":[[[[-22.8724103,16.6696193],[-22.924919,16.585595],[-22.9840127,16.8273509],[-22.8892456,16.8339415],[-22.8724103,16.6696193]]]]
        }
    },
    location: {
        timestamp: new Date(2016,5,15).getTime(),
        userId: '747941cfb829',
        accuracy: 10,
        altitude: 102,
        altitudeAccuracy: -1,
        course: 274.01,
        latitude: 41.7381279,
        longitude: -121.5290743,
        speed: 6.02
    },
    locations: [
        {
            timestamp: 1453640093710,
            userId: '747941cfb829',
            accuracy: 10,
            altitude: 102,
            altitudeAccuracy: -1,
            course: 274.01,
            latitude: 16.7291266,
            longitude: -22.91764,
            speed: 6.02
        },
        {
            timestamp: 1453640094710,
            userId: '747941cfb829',
            accuracy: 10,
            altitude: 115,
            altitudeAccuracy: -1,
            course: 274.01,
            latitude: 16.729126675,
            longitude: -22.9176469,
            speed: 6.02
        },
        {
            timestamp: 1453640095710,
            userId: '747941cfb829',
            accuracy: 10,
            altitude: 1116,
            altitudeAccuracy: -1,
            course: 274.01,
            latitude: 16.7291266,
            longitude: -22.91764,
            speed: 6.02
        },
        {
            timestamp: 1453640096710,
            userId: '747941cfb829',
            accuracy: 10,
            altitude: 1100,
            altitudeAccuracy: -1,
            course: 274.01,
            latitude: 16.7891266,
            longitude: 22.91764,
            speed: 6.02
        }
    ],
    userId: '747941cfb829'
};

module.exports = fixtures;
