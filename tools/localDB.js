"use strict"

const async = require('async'),
      moment = require('moment'),
      services = require('./services'),
      readlineSync = require('readline-sync');

let names = {};

function displayVisits(callback) {
    services.visits.getVisits('10152875766888406', {}, (err, visits) => {
        if (err && callback) return callback(err);
        let visitDisplay = [];
        visits.forEach(visit => {
            let startDate = new Date(visit.start);
            let formattedStartDate = moment(startDate).format(dateFormatString);
            let finishDate = new Date(visit.finish);
            let formattedFinishDate = moment(finishDate).format(dateFormatString);
            let derefedFeatureId = names[visit.featureId];
            let formattedFeatureId = derefedFeatureId;

            visitDisplay.push(`${formattedFeatureId}: ${formattedStartDate} => ${formattedFinishDate}: ${visit.id}`);
        });

        visitDisplay.sort();
        visitDisplay.forEach(visit => console.log(visit));

        if (callback) return callback();
    });
}

let lineReader = require('readline').createInterface({
    input: require('fs').createReadStream('data/tim2016Inter.json')
});

let intersections = [];
lineReader.on('line', intersectionLine => {
    intersections.push(
        JSON.parse(intersectionLine)
    );
});

let dateFormatString = 'YYYY-MM-DD HH:mm:ss';
lineReader.on('close', () => {
    let visits = {};
    let count = 0;

    services.init(err => {
        if (err) return console.log(err);

        async.eachLimit(intersections, 20, (intersection, intersectionCallback) => {
            //if (count > 1500 /*&& count % 200 === 0*/) readlineSync.question('press return to continue');
            count += 1;


            intersection.features.forEach(feature => {
                names[feature.id] = feature.names.common;
            });


            services.visits.updateVisitsFromIntersection(intersection, err => {
                console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
                console.log('completed intersection at index: ' + count);
                console.log('INTERSECTION @ ' + intersection.timestamp + ": " + moment(new Date(intersection.timestamp)).format(dateFormatString));
                intersection.features.forEach(feature => console.log(feature.names.common));
                displayVisits(intersectionCallback);
            });
        }, (err) => {
            displayVisits(process.exit);
        });
    });
});
