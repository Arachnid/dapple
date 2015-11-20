porting dapple to javascript


* building and deploying

Ethereum is unique in that all developers share a runtime environment. As contracts are deployed, new addresses are created, which
are eventually written into other code.


dapple takes a disciplined approach to deploying systems of contracts.

### Definitions:

"Contract" is ambiguous - these terms are preferred:
**type**: A Solidity "contract" (potentially any named bit of code that can be deployed) - a type name used during compilation
**object**: A specific contract instance that has been deployed and has an address

**chain context**: A set of named addresses (possibly null/undefined) for a given blockchain
**contract sources**: A set of Solidity source files

**package**: collection of contract sources with a chain context
**bound package**: A package with all named addresses defined
**unbound package**: A package with at least one undefined named address

**staged package**: A package whose chain context can be modified

**deploy step**: An instruction that makes a change to a staged package AND/OR the global network state

	* pending: dapple sent a transaction, but has not confirmed the action
	* complete: dapple has confirmed that the transaction had the intended effect and is permanent

**deploy sequence**: A sequence of deploy steps associated with a particular package. 



A package will typically ship a dev deploy sequence which will create a chain context which mocks the
one deployed on Ethereum.
