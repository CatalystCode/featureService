"use strict";

let fs = require('fs');
let path = require('path');

let services = require('../services');

let deploymentSHA;
fs.readFile(path.join(__dirname, '..', 'deployment_sha'), 'utf8', (err, sha) => {
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
