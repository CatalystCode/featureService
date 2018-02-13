const pg = require('pg'),
      process = require('process'),
      querystring = require('querystring'),
      HttpStatus = require('http-status-codes'),
      common = require('service-utils'),
      ServiceError = common.utils.ServiceError,
      url = require('url');

function init(callback) {
    const connectionString = process.env.FEATURES_CONNECTION_STRING;

    if (!connectionString) {
        return callback(new ServiceError(HttpStatus.INTERNAL_SERVER_ERROR, "Environment not set up to connect to DB"));
    }

    const params = url.parse(connectionString);
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
