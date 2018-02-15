const
    pg = require('pg'),
    querystring = require('querystring'),
    HttpStatus = require('http-status-codes'),
    common = require('service-utils'),
    ServiceError = common.utils.ServiceError,
    url = require('url');

function init(callback) {
    if (!config.featuresConnectionString) {
        return callback(new ServiceError(HttpStatus.INTERNAL_SERVER_ERROR, 'Environment not set up to connect to DB'));
    }

    const params = url.parse(config.featuresConnectionString);
    const query = querystring.parse(params.query);
    const auth = params.auth.split(':');

    const config = {
        user: auth[0],
        password: auth[1],
        host: params.hostname,
        port: params.port,
        ssl: query['ssl'],
        database: params.pathname.split('/')[1]
    };

    const featureDatabasePool = new pg.Pool(config);

    return callback(null, featureDatabasePool);
}

module.exports = {
    init: init
};
