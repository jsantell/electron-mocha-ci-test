var path = require('path');
var utils = require('./utils');
var ELECTRON_MOCHA = path.join(__dirname, '..', 'node_modules', '.bin', 'electron-mocha');
var PATH_TO_ELECTRON_MOCHA_OPTS = path.join(__dirname, '..', 'test', 'mocha.opts');
var PATH_TO_TESTS = path.join(__dirname, '..', 'test');

function spawn() {
  return utils.spawn(ELECTRON_MOCHA, [
    '--renderer',
//    '--opts', PATH_TO_ELECTRON_MOCHA_OPTS,
//    PATH_TO_TESTS,
  ], {
    stdio: 'inherit',
      env: {
       ELECTRON_PATH: utils.getElectronPath(),
      },
  });
}

if (require.main === module) {
  spawn().then(console.log, function(err) {
    console.error('Spawn error', err);
  });
}
