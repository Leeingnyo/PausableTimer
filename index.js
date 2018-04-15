var timeouts = {};
var intervals = {};
var map = {};
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
  id = traceId(id);
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
  id = traceId(id);
  clearInterval(id);
  delete intervals[id];
};
traceId = function (id) {
  if (map[id]) return traceId(map[id]);
  return id;
}

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
    var newId = mySetTimeout(callback, delay, ...args);
    map[id] = newId;
    delete timeouts[id];
  });
  Object.keys(intervals).forEach(function (id) {
    var target = intervals[id];
    var { callback, interval, args, leftTime } = target;
    var newId = setTimeout(function () {
      callback(...args);
      var realNewId = mySetInterval(callback, interval, ...args);
      map[newId] = realNewId;
    }, leftTime);
    map[id] = newId;
    delete intervals[id];
  });
}
