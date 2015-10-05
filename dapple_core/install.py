from __future__ import print_function
from requests.exceptions import ConnectionError

import ipfsApi
import tarfile
import os
import shutil
import sys

import dapple.plugins
from dapple.cli import cli, click

@dapple.plugins.register('ipfs.init_client')
def get_ipfs_client(options=None):
    return ipfsApi.Client("127.0.0.1", 5001)


@dapple.plugins.register('ipfs.get_dir')
def ipfs_get_dir(ipfs, nodehash, cwd):
    obj = ipfs.ls(nodehash)["Objects"][0]

    for item in obj["Links"]:
        if item["Type"] == 1:
            subdir = os.path.join(cwd, item["Name"])
            os.mkdir(subdir)
            ipfs_get_dir(ipfs, item["Hash"], subdir)

        elif item["Type"] == 2:
            filename = os.path.join(cwd, item["Name"])
            with open(filename, "w") as f:
                f.write(ipfs.cat(item["Hash"]))


@cli.command(name="install")
@click.argument("name")
@click.option("--ipfs")
@click.option("--save", is_flag=True, default=False)
def cli_install_package(name, ipfs=None, save=None):
    ipfs_client = dapple.plugins.load('ipfs.init_client')()
    get_dir = dapple.plugins.load('ipfs.get_dir')

    if save:
        print("WARNING: --save not yet implemented!", file=sys.stderr)

    if not ipfs:
        print("ERROR: --ipfs option is required for now.", file=sys.stderr)
        exit(1)

    packages_dir = os.path.join(os.getcwd(), '.dapple', 'packages') 

    if not os.path.isdir(packages_dir):
        os.mkdir(packages_dir)

    package_dir = os.path.join(packages_dir, name)
    try:
        if not os.path.isdir(package_dir):
            os.mkdir(package_dir)

        get_dir(ipfs_client, ipfs, package_dir)
        print("Successfully installed package `%s`" % name)

        exit(0)

    except ConnectionError:
        print("Could not connect to IPFS! Are you sure it's running?",
                file=sys.stderr)

    except OSError:
        print("Error trying to write to `%s`! "
                "Package may not have installed correctly." % package_dir,
                file=sys.stderr)
    
    exit(1)


@cli.command(name="publish")
def cli_publish_package(): 
    ipfs = dapple.plugins.load('ipfs.init_client')()

    try:
        package = ipfs.add(os.getcwd(), recursive=True)[-1]
        print("Package published on IPFS at %s" % package['Hash'])

    except ConnectionError:
        print("Could not connect to IPFS! Are you sure it's running?",
                file=sys.stderr)
        exit(1)


if __name__ == '__main__':
    import filecmp

    ipfs = dapple.plugins.load('ipfs.init_client')()
    package_dir = "testdir_src"
    output_dir = "testdir_dest"
    shutil.rmtree(output_dir, True)

    try:
        package = ipfs.add(package_dir, recursive=True)[-1]

    except ConnectionError:
        print("Could not connect to IPFS! Are you sure it's running?",
                file=sys.stderr)
        exit(1)

    package_hash = package["Hash"]

    os.mkdir(output_dir)
    get_dir = dapple.plugins.load('ipfs.get_dir')
    get_dir(ipfs, package_hash, os.path.join(os.getcwd(), output_dir))

    if filecmp.dircmp(package_dir, output_dir).diff_files:
        print("IPFS does not appear to have properly copied %s" % package_dir,
                file=sys.stderr)
    else:
        print("Test directory hash: " + package_hash)
        print("Everything appears to be working correctly.")
