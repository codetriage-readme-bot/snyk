var toTasks = require('../cli/commands/protect/tasks');
var test = require('tap-only');
var Promise = require ('es6-promise').Promise; // jshint ignore:line
var answers = require(__dirname + '/fixtures/patch-same-package-answers.json');
var proxyquire = require('proxyquire');
var sinon = require('sinon');
var noop = function () {};

// spies
var execSpy = sinon.spy();
var renameSpy = sinon.spy();
var writeSpy = sinon.spy();

// main proxy
var patch = proxyquire('../lib/protect/patch', {
  'recursive-readdir': function (source, cb) {
    cb(null, ['uglify.js.orig']);
  },
  './getVulnSource': function () {
    return 'foo';
  },
  'then-fs': {
    rename: function (filename) {
      renameSpy(filename);
      return Promise.resolve();
    },
    writeFile: function (filename, body) {
      writeSpy(filename, body);
      return Promise.resolve();
    },
    createWriteStream: function () {
      // fake event emitter (sort of)
      return {
        on: noop,
        end: noop,
        removeListener: noop,
        emit: noop,
      };
    },
  },
  './apply-patch': proxyquire('../lib/protect/apply-patch', {
    'child_process': {
      exec: function (a, b, callback) {
        // ignore dry run
        if (a.indexOf('--dry-run') === -1) {
          execSpy(a);
        }
        callback(null, '', ''); // successful patch
      }
    }
  })
});

test('if two patches for same package selected, only newest runs', function (t) {
  var tasks = toTasks(answers);

  debugger;
  return patch(tasks.patch, true).then(function () {
    t.equal(execSpy.callCount, 1, 'should only patch once');
  });
});