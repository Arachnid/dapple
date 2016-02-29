# Dapple
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)
[![Slack Status](http://slack.makerdao.com/badge.svg)](https://slack.makerdao.com)
[![Build Status](https://travis-ci.org/NexusDevelopment/dapple.svg?branch=master)](https://travis-ci.org/NexusDevelopment/dapple)

<p align="center">
  <img width=196" src="http://ipfs.pics/ipfs/QmPQcPiaep6Bfp956b5xLDaQdtQVtAWBT9QjWNRiL9y8Cw"/>
</p>

`dapple` is a tool for Solidity developers to help build and manage complex contract systems on Ethereum-like blockchains.

`dapple` is a Solidity developer multitool concerned primarily with managing the growing complexity of interconnected smart contract systems. Its core functionality encompasses *package management*, *build process*, and *deployment scripting*. These concepts are related in a way that is unique to the smart contract ecosystem, due to each blockchain's universal singleton nature. The central data model is the `dappfile`, whose definition depends on IPFS and also on the Ethereum blockchain specifically.

#### Installation

`npm install -g dapple`

#### Basic Usage

##### Create a package directory
```
mkdir mydapp && cd mydapp
dapple init
```

`dapple init` generates a simple boilerplate `dappfile` in the current
directory.

If no errors are displayed, the initialization was a success. You should be able
to see the boilerplate `dappfile` in your current directory, along with a couple
other directories:

```
$ ls
build  contracts  dappfile 
```

By default, `build` is where the output of `dapple build` gets put, and
`contracts` is where Dapple looks for your contract source files. Both of these
are configured in your `dappfile` and can be overridden.



Write a contract and test (see [dapple test harness docs](https:github.com/nexusdev/dapple/doc/test.md)).

```
vim contracts/dapp.sol
vim contracts/dapp_test.sol
dapple test
```

Emit build objects, classes.json, and javascript module:
```
dapple build
```

Install via IPFS
```
dapple install 
```

Install via dapphub
```
dapple test
```

Publish to dapphub (currently requires nexus admin key)
```
dapple publish
```


