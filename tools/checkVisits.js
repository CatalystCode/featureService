'use strict';

const async = require('async'),
      services = require('../services');

let rhomFeatures = {};

services.init(err => {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    services.visits.getByUserId("10152875766888406", (err, visits) => {
        console.log(err);
        console.log(visits.length);
        if (err) {
            console.log(err);
            process.exit(1);
        }

        visits.sort((a,b) => {
            return a.start - b.start;
        });

        let visitsForFeatureId = {}

        visits.forEach(visit => {
            if (!visitsForFeatureId[visit.featureId]) {
                visitsForFeatureId[visit.featureId] = [ visit ];
            } else {
                visitsForFeatureId[visit.featureId].push(visit);
            }
        });

        let problems = 0;

        Object.keys(visitsForFeatureId).forEach(featureId => {
            let featureIdVisits = visitsForFeatureId[featureId];
            let lastFeatureIdVisit;
            featureIdVisits.forEach(featureIdVisit => {
                if (lastFeatureIdVisit) {
                    if (lastFeatureIdVisit.finish > featureIdVisit.start) {
                        console.log('found inconsistency: ');
                        console.log('last visit:');
                        console.log(JSON.stringify(lastFeatureIdVisit, null, 2));
                        console.log('visit:');
                        console.log(JSON.stringify(featureIdVisit, null, 2));

                        problems += 1;
                    }
                }
                lastFeatureIdVisit = featureIdVisit;
            });
        });

        console.log('totals: ' + visits.length + ' problems: ' + problems);
        process.exit(0);
    });
});
