"use strict"
const async = require('async'),
      common = require('service-utils'),
      services = require('../services');

const SETTLE_ITERATIONS = 100;
const MAX_PARALLEL_REQUESTS = 50;

function measureLatency(parallelism, callback) {
    let totalRequests = 0;
    let totalLatency = 0;
    let parallelismStart = Date.now();

    let threads = [];
    for (let idx = 0; idx < parallelism; idx++) {
        threads.push(idx);
    }

    async.each(threads, (thread, threadCallback) => {
        let iterationCount = 0;
        async.whilst(
            () => { return iterationCount < SETTLE_ITERATIONS; },
            callback => {
                iterationCount += 1;

                let startTimestamp = Date.now();
                let latitude = 180.0 * Math.random() - 90.0;
                let longitude = 360.0 * Math.random() - 180.0;

                services.features.getByBoundingBox({
                    north: latitude + 0.05,
                    south: latitude - 0.05,
                    east: longitude + 0.05,
                    west: longitude - 0.05
                }, err => {
                    if (!err) {
                        totalRequests += 1;
                        totalLatency += (Date.now() - startTimestamp);
                    }

                    return callback();
                });
            },
            threadCallback
        );
    }, err => {
        let averageLatency = totalLatency / totalRequests;
        let wallclockTime = (Date.now() - parallelismStart) / 1000.0;
        let requestsPerSecond = totalRequests / wallclockTime;

        console.log(`${parallelism}: ${averageLatency} @ ${requestsPerSecond}`);
        return callback();
    });
}

let parallelRequests = 0;

services.init(err => {
    if (err) {
        return common.services.log.error('failed to initialize: ' + err);
        process.exit(1);
    }

    async.whilst(
        () => { return parallelRequests < MAX_PARALLEL_REQUESTS; },
        callback => {
            parallelRequests += 1;
            measureLatency(parallelRequests, callback);
        },
        process.exit
    );
});
