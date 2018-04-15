window.requestAnimFrame = (function(callback) {
  var startTime = new Date();
  return window.requestAnimationFrame || 
  window.webkitRequestAnimationFrame || 
  window.mozRequestAnimationFrame || 
  window.oRequestAnimationFrame || 
  window.msRequestAnimationFrame ||
  function(callback) {
    window.setTimeout(function () {
      callback(new Date() - startTime);
    }, 1000 / 60);
  };
})();

var items = {};

var key = 0;
var active = true;
var baseTime = null;
var acc = 0;
(function zz(timestamp) {
  if (active) {
    Object.values(items).forEach(function (item) {
      if (item.timestamp + item.after < timestamp) {
        delete items[item.key];
        item.func();
      }
    });
  } else {
    if (baseTime) {
      acc += timestamp - baseTime;
    }
    baseTime = timestamp;
  }

  requestAnimationFrame(zz);
})();

function register(callback, delay = 0) {
  items[key] = {
    func: callback,
    timestamp: performance.now(),
    after: delay,
    key: key
  };
  return key++;
}

function deactivate() {
  active = false;
  acc = 0;
  console.log('deactivated!');
}

function activate() {
  Object.values(items).forEach(function (item) {
    item.after += acc;
  });
  active = true;
  console.log('activated!', 'stop', acc, 's');
}

var a = new Date();
register(function () { console.log('self', new Date() - a) }, 5000);
setTimeout(function () { console.log('real', new Date() - a) }, 5000);
// diff: 14ms
