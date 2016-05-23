// Any copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/

var path = require('path');
var fs = require('fs-promise');
var os = require('os');

var download = require('electron-download');
var unzip = require('extract-zip');
var thenify = require('thenify');
var task = require('co-task');
var BuildUtils = require('./utils');

exports.downloadElectron = task.async(function* () {
  const tmpDir = path.join(os.tmpdir(), 'tofino-tmp');
  yield fs.mkdirs(tmpDir);

  try {
    const zipPath = yield thenify(download)(BuildUtils.getDownloadOptions());

    yield thenify(unzip)(zipPath, { dir: tmpDir });

    // Some tools like electron-rebuild rely on this to find the executable
    yield fs.writeFile(path.join(tmpDir, 'path.txt'),
                       BuildUtils.getElectronExecutable()[os.platform()]);

    const targetDir = BuildUtils.getElectronRoot();
    yield fs.remove(targetDir);
    yield fs.move(tmpDir, targetDir);
  } finally {
    if (yield fs.exists(tmpDir)) {
      fs.remove(tmpDir);
    }
  }
});

exports.rebuild = task.async(function* () {
  const command = path.join(__dirname, '..', 'node_modules', '.bin', 'electron-rebuild');
  return BuildUtils.spawn(command, [
    '-f',
    '-e', BuildUtils.getElectronRoot(),
    '-v', BuildUtils.getElectronVersion(),
  ], {
    stdio: 'inherit',
  });
});

exports.build = task.async(function* () {
  let existingConfig = {};
  try {
    existingConfig = BuildUtils.getBuildConfig();
  } catch (e) {
    // Missing files mean we rebuild
  }

  const electron = BuildUtils.getManifest()._electron;
  let currentElectron = null;
  try {
    currentElectron = BuildUtils.getElectronVersion();
  } catch (e) {
    // Fall through and download
  }

  if (electron.version !== currentElectron) {
    yield exports.downloadElectron();
  }

  yield exports.rebuild();
});

if (require.main === module) {
  exports.build().then(console.log, console.error);
}
