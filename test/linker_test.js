'use strict';

var _ = require('lodash');
var assert = require('chai').assert;
var fs = require('fs');
var Linker = require('../lib/linker.js');
var testenv = require('./testenv');
var path = require('path');
var SourcePipeline = require('../lib/pipelines.js').SourcePipeline;
var Web3 = require('web3');
var Web3Factory = require('../lib/workspace.js');
var Workspace = require('../lib/workspace.js');

describe("Linker", function() {
    var web3 = new Web3();
    var sources = {};
    var workspace;

    before(function (done) {
        testenv.get_source_files(testenv.linker_package_dir, function (files) {
            sources = _.object(_.map(
                    files, (file) => [file.path, String(file.contents)]));
            workspace = new Workspace(_.values(files));
            done();
        });
    });

    it("converts all source paths to hashes based on file contents",
       function() {
           var linkedSources = Linker.linkImports(workspace, sources);
           var sourcefileCount = 0;

           for (let path of _.keys(linkedSources)) {
               if (path == Linker.SOURCEMAP_KEY
                   || path == Linker.CONTRACTMAP_KEY) {
                       continue;
               }

               sourcefileCount += 1;
               assert(/^_[a-f0-9]+\.sol$/.test(path),
                      "unhashed path found after linking: " + path);
           }
           assert.isAbove(sourcefileCount, 0, "no source files observed!");
       });

    it("changes all import statements to point to hashpaths", function() {
       var linkedSources = Linker.linkImports(workspace, sources);
       var importRE = /import ['|"]([^'|"]+)['|"]/g;
       var importsChecked = 0;

       for (let source of _.values(linkedSources)) {
           let match;
           while ((match = importRE.exec(source)) !== null) {
               importsChecked += 1;
               assert(match[1] in linkedSources,
                      "unresolvable import: " + match[0]);
           }
       }
       assert.isAbove(importsChecked, 0, "no imports found!");
    });

    it("includes a source map for linked imports", function() {
       var linkedSources = Linker.linkImports(workspace, sources);
       assert(Linker.SOURCEMAP_KEY in linkedSources);
    });

    it("replaces contract names with hashes", function() {
        var linkedSources = Linker.link(workspace, sources);
        linkedSources[Linker.SOURCEMAP_KEY] = JSON.parse(
            linkedSources[Linker.SOURCEMAP_KEY]);

        var getHashpath = function(filename) {
            var hashPath;
            for (var _hashPath in linkedSources[Linker.SOURCEMAP_KEY]) {
                let path = linkedSources[Linker.SOURCEMAP_KEY][_hashPath][0];
                if (path.endsWith(filename)) {
                    hashPath = _hashPath;
                };
            }
            return hashPath;
        };

        var contract_hash = getHashpath(
            'dapple_packages/pkg/src/sol/contract.sol');
        var local_contract_hash = getHashpath(
            'linker_test_package/src/sol/pkg/contract.sol');

        var template = _.template(fs.readFileSync(path.join(
            workspace.getPackageRoot(), "src.linked",
            "sol", "linker_example.sol"), {encoding: 'utf8'}))

        var expectedOutput = template({
            contract_hash: contract_hash,
            local_contract_hash: local_contract_hash,
            pkg_contract_hash: Linker.uniquifyContractName(
                local_contract_hash, 'PkgContract'
            ),
            dapple_pkg_contract_hash: Linker.uniquifyContractName(
                contract_hash, 'DapplePkgContract'
            )
        });

        var example_hash = getHashpath('/linker_example.sol');
        assert.equal(linkedSources[example_hash], expectedOutput);
    });
});
