'use strict';

const express = require('express'),
      app = express(),
      bodyParser = require('body-parser'),
      common = require('service-utils'),
      cors = require('cors'),
      morgan = require('morgan'),
      server = require('http').createServer(app),
      services = require('./services'),
      controllers = require('./controllers');

app.use(cors());

app.use(morgan('combined'));
app.use(bodyParser.json());

app.get('/features/bbox/:north/:west/:south/:east', controllers.features.getByBoundingBox);
app.get('/features/point/:latitude/:longitude',     controllers.features.getByPoint);

app.get('/visits/:userId',                          controllers.visits.get);

app.post('/intersection',                           controllers.intersection.post);

app.get('/ops/health',                              controllers.ops.health);
app.get('/',                                        controllers.ops.health);

services.init(function(err) {
    if (err) {
        return common.services.log.error('failed to initialize: ' + err);
        process.exit(1);
    }

    server.listen(process.env.PORT);
    common.services.appInsights.trackMetric("restart", 1);
    common.services.log.info('feature server listening on port: ' + process.env.PORT);
});

module.exports = server;
