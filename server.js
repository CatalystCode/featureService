'use strict';

const
    express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    common = require('service-utils'),
    cors = require('cors'),
    log = common.services.log('featureService/server'),
    morgan = require('morgan'),
    server = require('http').createServer(app),
    config = require('./config'),
    services = require('./services'),
    controllers = require('./controllers');

app.use(cors());
app.use(morgan('combined', { 'stream': log.stream }));
app.use(bodyParser.json({ limit: '50mb' }));

app.get('/features/id/:id',                         controllers.features.getById);
app.get('/features/bbox/:north/:west/:south/:east', controllers.features.getByBoundingBox);
app.get('/features/point/:latitude/:longitude',     controllers.features.getByPoint);
app.get('/features/name/:name',                     controllers.features.getByName);

services.init(function(err) {
    if (err) {
        log.error('failed to initialize: ' + err);
        return process.exit(1);
    }

    server.listen(config.port);
    log.info('feature server listening on port: ' + config.port);
});

module.exports = server;
