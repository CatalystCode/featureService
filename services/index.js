"use strict"

const async = require('async'),
      features = require('./features');

const submodules = [
    features
];

function init(callback) {
    async.each(submodules, (submodule, submoduleCallback) => submodule.init(submoduleCallback), callback);
}

module.exports = {
    features: features,
    init:       init,
};
