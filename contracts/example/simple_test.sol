import "dapple/test.sol";
import "dapple/example/simple.sol";

contract ExampleTest is Test {
    function testBasicThing() 
             tests("something basic")
    {
        uint one = 1;
        assertTrue(one == 1, "one must equal itself");
    }
}
