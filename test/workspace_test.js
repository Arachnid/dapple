'use strict';

var _ = require('lodash');
var DappleRC = require('../lib/dapplerc.js');
var expect = require("chai").expect;
var assert = require("chai").assert;
var fs = require("../lib/file");
var tmp = require("tmp");
var Workspace = require("../lib/workspace");
var constants = require("../lib/constants");
var testenv = require("./testenv");
var path = require("path");
var dircompare = require("dir-compare");


describe("class Workspace", function() {
    it(" .initialize(emptydir) matches golden version", function() {
        var dir = fs.tmpdir();
        Workspace.initialize(dir)
        //fs.copySync(dir, testenv.golden.INIT_EMPTY_DIR); //  Create a new golden record
        var diff = dircompare.compareSync(dir, testenv.golden.INIT_EMPTY_DIR);
        assert( diff.same );
    });

    it("finds dappfile in subdirectory", function(done) {
        assert( Workspace.findWorkspaceRoot(path.join(testenv.golden_package_dir, "subdirectory")) );
        done();
    });

    it("initializes successfully in golden package", function() {
        var workspace = new Workspace(testenv.golden_package_dir);
    });

    it("findWorkspaceRoot returns undefined if it hits root", function(done) {
        var dir = fs.tmpdir();
        assert.equal(undefined, Workspace.findWorkspaceRoot(dir));
        done();
    });

    it.skip("findWorkspaceRoot returns undefined if it hits .dapplerc", function(done) {
        var dir = "TODO";
        var workspace = new Workspace(testenv.golden_package_dir);
        assert.equal( undefined, workspace.findWorkspaceRoot(dir) );
        done();
    });

    it('knows how to load .dapplerc', function() {
        var fixtureRC = path.join(__dirname, '_fixtures', 'dapplerc');
        var rc = Workspace.getDappleRC({paths: [fixtureRC]});
        var expectedRC = fs.readYamlSync(fixtureRC + '.expanded');
        assert.deepEqual(rc.data, expectedRC, "did not load " + fixtureRC);
    });

    it('knows how to make .dapplerc', function() {
        var fixtureRC = path.join(__dirname, '_fixtures', 'dapplerc');
        var expectedRC = fs.readYamlSync(fixtureRC + '.expanded');
        var newRC = path.join(__dirname, '_fixtures', 'dapplerc_copy');
        Workspace.writeDappleRC(newRC, expectedRC);
        var rc = Workspace.getDappleRC({paths: [newRC]});
        fs.removeSync(newRC); // Cleanup

        assert.deepEqual(rc.data, expectedRC, "did not create dapplerc");
    });

    it('does not throw an exception if the dappfile is empty', function() {
        var workspace = new Workspace(testenv.empty_package_dir);
    });

    it('run its getters on an empty dappfile without throwing', function() {
        var workspace = new Workspace(testenv.empty_package_dir);
        var getters = [
            "getBuildDest",
            "getBuildDir",
            "getDappfilePath",
            "getDependencies",
            "getEnvironment",
            "getEnvironments",
            "getIgnoreGlobs",
            "getPackagesDir",
            "getPackagesPath",
            "getPreprocessorVars",
            "getSourceDir",
            "getSourcePath",
        ];

        for (let getter of getters) {
            assert.doesNotThrow(workspace[getter].bind(workspace),
                                Error, getter + ' threw!');
        }
    })
});
