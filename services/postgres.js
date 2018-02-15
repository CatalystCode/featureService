const
    pg = require('pg'),
    querystring = require('querystring'),
    HttpStatus = require('http-status-codes'),
    common = require('service-utils'),
    ServiceError = common.utils.ServiceError,
    config = require('../config'),
    url = require('url');

function init(callback) {
    if (!config.featuresConnectionString) {
        return callback(new ServiceError(HttpStatus.INTERNAL_SERVER_ERROR, 'Environment not set up to connect to DB'));
    }

    const params = url.parse(config.featuresConnectionString);
    const query = querystring.parse(params.query);
    const auth = params.auth.split(':');

    const featureDatabasePool = new pg.Pool({
        user: auth[0],
        password: auth[1],
        host: params.hostname,
        port: params.port,
        ssl: query['ssl'],
        database: params.pathname.split('/')[1]
    });

    return callback(null, featureDatabasePool);
}

module.exports = {
    init: init
};
