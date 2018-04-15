var timeouts = {};
var intervals = {};
mySetTimeout = function (callback, delay = 0, ...args) {
  var id = setTimeout(function (...args) {
    callback(...args);
    delete timeouts[id];
  }, delay, ...args);
  timeouts[id] = {
    callback,
    delay,
    args,
    timestamp: performance.now()
  };
  return id;
};
myClearTimeout = function (id) {
  clearTimeout(id);
  delete timeouts[id];
};
mySetInterval = function (callback, interval = 0, ...args) {
  var id = setInterval(function () {
    callback(...args);
  }, interval, ...args);
  intervals[id] = {
    callback,
    interval,
    args,
    timestamp: performance.now()
  };
  return id;
};
myClearInterval = function (id) {
  clearInterval(id);
  delete intervals[id];
};

function deactivate() {
  Object.keys(timeouts).forEach(function (id) {
    var timeout = timeouts[id];
    timeout.delay -= performance.now() - timeout.timestamp;
    clearTimeout(id);
  });
  Object.keys(intervals).forEach(function (id) {
    var interval = intervals[id];
    interval.leftTiem = (performance.now() - interval.timestamp) % interval.interval;
    clearInterval(id);
  });
}
function activate() {
  Object.keys(timeouts).forEach(function (id) {
    var timeout = timeouts[id];
    var { callback, delay, args } = timeout;
    mySetTimeout(callback, delay, ...args);
    delete timeouts[id];
  });
  Object.keys(intervals).forEach(function (id) {
    var target = intervals[id];
    var { callback, interval, args, leftTime } = target;
    setTimeout(function () {
      callback(...args);
      mySetInterval(callback, interval, ...args);
    }, leftTime);
    delete intervals[id];
  });
}
