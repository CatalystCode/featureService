function LocationPresenter() {}

LocationPresenter.render = function(locations) {
    var locations = locations.map(function(location) {
        return {
            type: 'location',
            attributes: location
        }
    });

    return {
        data: locations
    };
};

module.exports = LocationPresenter;