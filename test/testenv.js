"use strict";
var chai = require("chai");
var filter = require('gulp-filter');
var fs = require("../lib/file");
var SourcePipeline = require('../lib/pipelines.js').SourcePipeline;
var path = require("path");
var through = require("through2");
var Workspace = require('../lib/workspace.js');

module.exports = {
    golden_package_dir: path.join(
        __dirname, "_fixtures", "testenv", "golden_package"),
    GOLDEN_SOLC_OUT_PATH: path.join(
        __dirname, "_fixtures", "golden", "solc_out.json"),
    golden_solc_output: function() {
        return fs.readJsonSync(this.GOLDEN_SOLC_OUT_PATH);
    },
    golden: {
        ROOT: path.join(__dirname, "_fixtures", "testenv", "golden"),
        SOLC_OUT_PATH: function() {
            return path.join(__dirname, "_fixtures", "golden", "solc_out.json");
        },
        SOLC_OUT: function() {
            return fs.readJsonSync(this.SOLC_OUT_PATH())
        },
        INIT_EMPTY_DIR: path.join(
            __dirname, "_fixtures", "golden", "golden_init"),
        FILTERED_SOLC_OUT_PATH: path.join(
            __dirname, "_fixtures", "golden", "golden_solc_classes_out")
    },

    empty_package_dir: path.join(
        __dirname, "_fixtures", "testenv", "empty_package"),

    linker_package_dir: path.join(__dirname, "_fixtures", "linker_test_package"),

    get_source_files: function (packagePath, callback) {
        var sources = {};
        var packageRoot = Workspace.findPackageRoot(packagePath);

        SourcePipeline({packageRoot: packageRoot})
            .pipe(through.obj(function(file, enc, cb) {
                sources[file.path] = file;
                cb();

            }, function (cb) {
                callback(sources);
                cb();
            }));
    }
}
