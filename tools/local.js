"use strict"

const async = require('async'),
      moment = require('moment'),
      services = require('./services'),
      readlineSync = require('readline-sync');

let names = {};

function displayVisits(visits) {
    let visitDisplay = [];
    Object.keys(visits).forEach(visitId => {
        let visit = visits[visitId];
        let startDate = new Date(visit.start);
        let formattedStartDate = moment(startDate).format(dateFormatString);
        let finishDate = new Date(visit.finish);
        let formattedFinishDate = moment(finishDate).format(dateFormatString);
        let derefedFeatureId = names[visit.featureId];
        let formattedFeatureId = derefedFeatureId; //String("                              " + derefedFeatureId).slice(-25);

        visitDisplay.push(`${formattedFeatureId}: ${formattedStartDate} => ${formattedFinishDate}: ${visit.id}: ${visit.touched}`);
    });

    visitDisplay.sort();
    visitDisplay.forEach(visit => console.log(visit));

    //console.log('VISITS:');
    //console.log(JSON.stringify(visits, null, 2));
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

    intersections.forEach(intersection => {
        console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
        console.log('intersection count: ' + count);

        count += 1;

        intersection.features.forEach(feature => {
            names[feature.id] = feature.names.common;
        });

        let previousVisits = JSON.parse(JSON.stringify(visits));

        //console.log('CURRENT VISIT STATE');
        //displayVisits(previousVisits);

        //console.log(JSON.stringify(visits, null, 2));

        console.log('INTERSECTION @ ' + moment(new Date(intersection.timestamp)).format(dateFormatString));
        //let formattedIntersection = JSON.parse(JSON.stringify(intersection));
        //formattedIntersection.timestamp = moment(new Date(intersection.timestamp)).format(dateFormatString);
        console.log(JSON.stringify(intersection, null, 2));

        intersection.features.forEach(feature => console.log(feature.names.common));

        visits = services.visits.intersectVisits(visits, intersection);

        console.log('NEW VISIT STATE');
        displayVisits(visits);

        // if (count > 13 /*&& count % 200 === 0*/) readlineSync.question('press return to continue');
    });
});
