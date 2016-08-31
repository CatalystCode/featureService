var jwt = require('jsonwebtoken');

var fixtures = {
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
        "fullTag":"boundary:administrative"
    }
};

module.exports = fixtures;