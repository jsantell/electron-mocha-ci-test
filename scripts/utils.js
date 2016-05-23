// Any copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/

var os = require('os');
var path = require('path');
var task = require('co-task');
var fs = require('fs-promise');
var childProcess = require('child_process');
var manifest = require('../package.json');

const IS_TRAVIS = process.env.TRAVIS === 'true';
const IS_APPVEYOR = process.env.APPVETOR === 'True';

function getManifest() {
  return manifest;
}
exports.getManifest = getManifest;

function getElectronExecutable() {
  return {
    win32: 'electron.exe',
    darwin: path.join('Electron.app', 'Contents', 'MacOS', 'Electron'),
    linux: 'electron',
  };
}
exports.getElectronExecutable = getElectronExecutable;

// We cache the download in a private place since these builds may not be
// official Electron builds.
function getDownloadOptions() {
  return {
    version: manifest._electron.version,
    cache: path.join(__dirname, '..', '.cache'),
    strictSSL: true,
  };
}
exports.getDownloadOptions = getDownloadOptions;

function getAppVersion() {
  if (IS_TRAVIS) {
    return `${manifest.version}-${process.env.TRAVIS_BUILD_NUMBER}`;
  }
  if (IS_APPVEYOR) {
    return `${manifest.version}-${process.env.APPVEYOR_BUILD_NUMBER}`;
  }
  return manifest.version;
}

function getRoot() {
  return path.dirname(__dirname);
}

function getElectronRoot() {
  return path.join(__dirname, '..', '.electron');
}
exports.getElectronRoot = getElectronRoot;

function getElectronPath() {
  return path.join(getElectronRoot(), getElectronExecutable()[os.platform()]);
}
exports.getElectronPath = getElectronPath;

// This intentionally throws an exception if electron hasn't been downloaded yet.
function getElectronVersion() {
  const versionFile = path.join(getElectronRoot(), 'version');
  const version = fs.readFileSync(versionFile, { encoding: 'utf8' });

  // Trim off the leading 'v'.
  return version.trim().substring(1);
}
exports.getElectronVersion = getElectronVersion;

exports.spawn = task.async(function* (command, args, options) {
  options = options || {};
  if (os.type() === 'Windows_NT') {
    try {
      // Prefer a cmd version if available
      const testCommand = `${command}.cmd`;
      const stats = yield fs.stat(testCommand);
      if (stats.isFile()) {
        command = testCommand;
      }
    } catch (e) {
      // Ignore missing files.
    }
  }

  return new Promise((resolve, reject) => {
    console.log('Spawning', command, args, options);
    const child = childProcess.spawn(command, args, options);

    child.on('error', function(err) {
      console.log("ON ERROR", err);
      reject(err);
    });
    child.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Child process ${command} exited with exit code ${code}`));
      } else {
        resolve();
      }
    });
  });
});
