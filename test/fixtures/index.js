var jwt = require('jsonwebtoken');

var fixtures = {
    nodeFeature: {
        id: 544896521,
        centroid: {
            lat: 49.4989793,
            lon: 5.9783523,
        },
        fullTag: 'leisure:playground',
        category: 'leisure',
        tag: 'playground'
    },

    wayFeature: {
        id: 420028229,
        name: 'Luxemberg parking',
        centroid: {
            lat: 49.717977,
            lon: 6.010458
        },
        fullTag: 'amenity:parking',
        category: 'amenity',
        tag: 'parking'
    }
};

module.exports = fixtures;