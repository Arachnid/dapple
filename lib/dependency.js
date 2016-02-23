'use strict';

var child_process = require('child_process');
var fs = require('./file.js');
var path = require('path');
var req = require('lazreq')({
  constants: './constants.js',
  dapphub: './dapphub_registry.js',
  deasync: 'deasync',
  ipfsAPI: 'ipfs-api',
  os: 'os',
  Web3Factory: './web3Factory.js',
  Workspace: './workspace.js',
  ipfs: './ipfs.js'
});
var semver = require('semver');

module.exports = class Dependency {
  constructor (path, version, name) {
    this.setName(name || '');
    this.path = path || '';
    this.version = version || '';
    this.packagesDirectory = req.constants.PACKAGES_DIRECTORY;
    this.installedAt = '';

    if (this.hasGitPath() && !version) {
      throw new Error('Git paths must include an exact commit hash!');
    }
  }

  static fromDependencyString (path, name) {
    let gitPathRegex = /^(.+.git)(?:@([a-z0-9]+))$/i;
    if (gitPathRegex.test(path)) {
      let pathPieces = gitPathRegex.exec(path);
      let version = pathPieces[2];
      path = pathPieces[1];
      return new Dependency(path, version, name);
    }

    let pathRegex = /^([^0-9@#][^@#]*)?(?:@?(.+)?)?$/;
    let pathPieces = pathRegex.exec(path);
    let version = pathPieces[2];
    path = pathPieces[1];

    if (name && semver.valid(version)) {
      version = semver.clean(version);
      path = path || name;
      return new Dependency(path, version, name);
    }

    if (/^@?(ipfs:\/\/)?Qm[A-Za-z0-9]+$/i.test(version || path)) {
      if (!name) {
        name = version ? path : '';
      }
      version = (version || path).replace(/^@?ipfs:\/\//i, '');
      path = 'ipfs://' + version;
    }
    return new Dependency(path, version, name);
  }

  install (web3Settings) {

    if (this.getName()) {
      this._throwIfInstalled();
    }

    try {
      fs.accessSync(this.packagesDirectory, fs.W_OK);
    } catch (e) {
      try {
        fs.mkdirSync(this.packagesDirectory);
      } catch (e) {
        throw new Error('Could not access or create ' +
                        this.packagesDirectory + ': ' + e);
      }
    }

    if (this.getName()) {
      let installedAt = path.join(this.packagesDirectory, this.getName());
      this.pull(installedAt, web3Settings);
      this.installedAt = installedAt;
      return true;
    }

    let tmpDir = this._getTmpDir();
    this.pull(tmpDir);
    this.setName(req.Workspace.atPackageRoot(tmpDir).dappfile.name);

    let installedAt = path.join(this.packagesDirectory, this.getName());
    fs.copySync(tmpDir, installedAt);
    this.installedAt = installedAt;

    try {
      fs.removeSync(tmpDir);
    } catch (e) {
      throw new Error(this.getName() + ' installed at ' + installedAt +
                      ', but cleanup failed. Please manually delete ' + tmpDir);
    }
    return true;
  }

  hasDappHubPath () {
    return this.getName() && semver.valid(this.getVersion());
  }

  hasGitPath () {
    return /\.git$/i.test(this.path);
  }

  hasIPFSPath () {
    return /^ipfs:\/\/[A-Za-z0-9]+$/i.test(this.path);
  }

  hasVersion () {
    return this.version !== '';
  }

  getVersion () {
    return this.version;
  }

  getName () {
    return this.name;
  }

  setName (name) {
    this.name = name;
  }

  getPath () {
    return this.path;
  }

  toString () {
    return this.getPath() + this.getVersion();
  }

  _getTmpDir () {
    if (!this._tmpDir) {
      this._tmpDir = path.join(req.os.tmpdir(), 'dapple', 'packages',
                               String(Math.random()).slice(2));
      fs.emptyDirSync(this._tmpDir);
    }
    return this._tmpDir;
  }

  pull (destination, web3Settings) {
    if (this.hasDappHubPath()) {
      this._pullDappHub(web3Settings, destination);
    } else if (this.hasGitPath()) {
      this._pullGit(destination);
    } else if (this.hasIPFSPath()) {
      let hash = this.getPath().replace(/^ipfs:\/\//i, '');
      this._pullIPFS(hash, destination);
    } else {
      throw new Error('Could not make sense of "' + this.getPath() + '"');
    }
  }

  _pullGit (target) {
    if (!this.hasVersion()) {
      throw new Error('Git paths must include an exact commit hash!');
    }

    let commit = this.getVersion().replace(/^@/, '');

    if (!/^[a-f0-9]+$/i.test(commit)) {
      throw new Error('Invalid commit hash: ' + commit);
    }

    child_process.execSync('git clone ' + this.getPath() + ' ' + target);
    child_process.execSync('git reset --hard ' + commit, {cwd: target});
    child_process.execSync('git submodule init', {cwd: target});
    child_process.execSync('git submodule update', {cwd: target});
  }

  _pullIPFS (rootHash, target) {
    if( !this.__ipfs ) this.__ipfs = new req.ipfs(settings);
    let types = { dir: 1, file: 2 };

    // Test connection before proceeding.
    try {
      this.__ipfs.lsSync(rootHash);
    } catch (e) {
      throw new Error('Unable to retrieve directory from IPFS! ' +
                      'Please make sure your IPFS connection settings ' +
                      'in ~/.dapplerc are correct and that you have ' +
                      'supplied the correct IPFS hash.');
    }

    var fileMap = this.__ipfs.mapAddressToFileSync( rootHash );
    this.__ipfs.checkoutFilesSync( target, fileMap );
  }

  _pullDappHub (web3Settings, target) {
    var web3;
    if (web3Settings === 'internal') {
      throw new Error('DappHub registry is not available on internal chains.');
    } else {
      try {
        web3 = req.Web3Factory.JSONRPC({web3:web3Settings});
      } catch (e) {
        throw new Error('Unable to connect to Ethereum client: ' + e);
      }
    }

    let dapphub = new req.dapphub.Class(web3, 'morden');
    let packageHash = dapphub.objects.dapphubdb.getPackageHash.call(
        this.getPath(), semver.major(this.getVersion()),
        semver.minor(this.getVersion()), semver.patch(this.getVersion()));

    if (!packageHash || /^0x0?$/.test(packageHash)) {
      throw new Error('No IPFS hash found for ' + this.getPath() +
                      '@' + this.getVersion());
    }
    let packageHeaderHash = web3.toAscii(packageHash);
    let settings = req.Workspace.getDappleRC().environment('live');
    if( !this.__ipfs ) this.__ipfs = new req.ipfs(settings);
    let header = this.__ipfs.catJsonSync( packageHeaderHash )
    this._pullIPFS(header.root, target);
  }

  _throwIfInstalled () {
    let target = path.join(this.packagesDirectory, this.getName());
    let alreadyInstalled = false;

    try {
      fs.accessSync(target, fs.R_OK);
      alreadyInstalled = true;
    } catch (e) {}

    if (alreadyInstalled) {
      throw new Error(this.getName() + ' is already installed.');
    }
  }
};
