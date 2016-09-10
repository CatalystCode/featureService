"use strict"

const async = require('async'),
      features = require('./features'),
      visits = require('./visits');

const submodules = [
    features,
    visits
];

function init(callback) {
    async.each(submodules, (submodule, submoduleCallback) => submodule.init(submoduleCallback), callback);
}

module.exports = {
    features:   features,
    init:       init,
    visits:     visits
};
