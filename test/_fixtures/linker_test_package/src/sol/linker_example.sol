// The linker should link this to the copy of contract.sol in dapple_packages.
import 'pkg/contract.sol';

// The linker should link this to the local copy of contract.sol.
import './pkg/contract.sol';

contract LinkerExample {
    PkgContract pkgContract;
    DapplePkgContract dapplePkgContract;

    function LinkerExample() {
        pkgContract = new PkgContract();
        dapplePkgContract = new DapplePkgContract();
    }
}
