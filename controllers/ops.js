"use strict";

let fs = require('fs');

let services = require('../services');

let deploymentSHA;
fs.readFile('./deployment_sha', 'utf8', (err, sha) => {
    deploymentSHA = sha.trim();
});

exports.health = function(req, res) {
    services.features.getById({
        id: "0"
    }, (err) => {
        if (err) return res.send(500, { "ok": false, "error": err });

        res.send({
            "ok": true,
            "sha": deploymentSHA
        });
    });
};
