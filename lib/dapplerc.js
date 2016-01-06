'use strict';

var _ = require('lodash');
var fs = require('../lib/file.js');
var path = require('path');
var userHome = require('user-home');

module.exports = class DappleRC {
    constructor(opts) {
        // Set default values for unspecified options.
        opts = _.assign({
            paths: ['/etc/dapple/config', path.join(userHome, '.dapplerc')]
        }, opts);

        // Find the first path that exists.
        for (let p of opts.paths) {
            try {
                fs.accessSync(p, fs.R_OK);
                this.path = p;
                break;
            } catch (e) {}
        }

        // Stop now if we could not load a config file.
        if (!this.path) return;

        // Load config
        this.data = fs.readYamlSync(this.path);

        // Fill in default values.
        // First make sure our "default" key is set.
        if (!("default" in this.data.environments)) {
            this.data.environments.default = {};
        }

        // Then fill in any options that have been left out
        // with our default values.
        for (let env in this.data.environments) {
            if (this.data.environments[env] == "default") {
                this.data.environments[env] = this.data.environments.default;

            } else {
                this.data.environments[env] = _.assign(
                    _.cloneDeep(this.data.environments.default),
                    this.data.environments[env]);
            }
        }
    }
}
