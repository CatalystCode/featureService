function ActivityPresenter() {}

ActivityPresenter.render = function(activity) {
    return {
        data: {
            type: 'activity',
            attributes: activity
        }
    };
};

module.exports = ActivityPresenter;