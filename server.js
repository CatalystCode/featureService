'use strict';

const express = require('express'),
      app = express(),
      bodyParser = require('body-parser'),
      common = require('service-utils'),
      cors = require('cors'),
      log = common.services.log("featureService/server"),
      morgan = require('morgan'),
      server = require('http').createServer(app),
      services = require('./services'),
      controllers = require('./controllers');

app.use(cors());
app.use(morgan("combined", { "stream": log.stream }));
app.use(bodyParser.json({ limit: '50mb' }));

app.get('/features/bbox/:north/:west/:south/:east', controllers.features.getByBoundingBox);
app.get('/features/point/:latitude/:longitude',     controllers.features.getByPoint);
app.get('/features/name/:name',                     controllers.features.getByName);

app.get('/visits/:userId',                          controllers.visits.get);
app.put('/visits/:userId',                          controllers.visits.put);

app.get('/ops/health',                              controllers.ops.health);
app.get('/',                                        controllers.ops.health);

services.init(function(err) {
    if (err) {
        return log.error('failed to initialize: ' + err);
        process.exit(1);
    }

    server.listen(process.env.PORT);
    log.info('feature server listening on port: ' + process.env.PORT);
});

module.exports = server;
