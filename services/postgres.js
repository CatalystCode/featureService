const pg = require('pg'),
      process = require('process'),
      querystring = require('querystring'),
      url = require('url');

function escapeSql(value) {
    return `'${value.replace(/'/g,"''")}'`;
}

function init(callback) {
    const connectionString = process.env.FEATURES_CONNECTION_STRING;

    if (!connectionString) {
        const err = new ServiceError(HttpStatus.INTERNAL_SERVER_ERROR, "FEATURES_CONNECTION_STRING configuration not provided as environment variable");
        return callback(err);
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
    escapeSql: escapeSql,
    init: init
};
