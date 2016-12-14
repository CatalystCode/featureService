var express = require('express')
  , app = express()
  , bodyParser = require('body-parser')
  , common = require('service-utils')
  , morgan = require('morgan')
  , server = require('http').createServer(app)
  , services = require('./services')
  , controllers = require('./controllers');

//var appInsights = require('applicationinsights');
//appInsights.setup().start();
//var appInsightsClient = appInsights.getClient();

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,POST,PUT,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.use(morgan('combined'));
app.use(bodyParser.json());

app.get('/features/bbox/:north/:west/:south/:east', controllers.features.getByBoundingBox);
app.get('/features/point/:latitude/:longitude',     controllers.features.getByPoint);

app.get('/visits/:userId',                          controllers.visits.get);

app.post('/intersection',                           controllers.intersection.post);

app.get('/ops/health',                              controllers.ops.health);

services.init(function(err) {
    if (err) {
        return common.services.log.error('failed to initialize: ' + err);
        process.exit(1);
    }

    server.listen(process.env.PORT);
    common.services.log.info('feature server listening on port: ' + process.env.PORT);
});

module.exports = server;