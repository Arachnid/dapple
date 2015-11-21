require("use-strict");
var assert = require('assert');
describe('builder example tests', function() {
    var Builder = require('../lib/build');
    b = new Builder();
    var paths = [ "defaults/example_package/example.sol"
                , "defaults/example_package/example_test.sol" ]

    it('', function() {
        var abis = b.buildWithDapplePackage(b.readSourceFiles(paths));
        assert(abis.Example.bytecode.length > 0);
        done();
    });
});
