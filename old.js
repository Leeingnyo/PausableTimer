var PausableTimer = function () {
  var timeouts = {};
  var intervals = {};
  var map = {};
  function traceId(id) {
    if (map[id]) return traceId(map[id]);
    return id;
  }

  var isActive = true;
  this.isActive = function () {
    return isActive;
  };

  this.setTimeout = function (callback, delay = 0, ...args) {
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
    if (!isActive) {
      clearTimeout(id);
    }
    return id;
  };
  this.clearTimeout = function (id) {
    id = traceId(id);
    clearTimeout(id);
    delete timeouts[id];
  };
  this.setInterval = function (callback, interval = 0, ...args) {
    var id = setInterval(function () {
      callback(...args);
    }, interval, ...args);
    intervals[id] = {
      callback,
      interval,
      args,
      timestamp: performance.now()
    };
    if (!isActive) {
      clearInterval(id);
    }
    return id;
  };
  this.clearInterval = function (id) {
    id = traceId(id);
    clearInterval(id);
    delete intervals[id];
  };

  this.deactivate = function () {
    Object.keys(timeouts).forEach(function (id) {
      var timeout = timeouts[id];
      timeout.delay -= performance.now() - timeout.timestamp;
      clearTimeout(id);
    });
    Object.keys(intervals).forEach(function (id) {
      var interval = intervals[id];
      interval.leftTime = interval.interval - (performance.now() - interval.timestamp) % interval.interval;
      clearInterval(id);
    });
    isActive = false;
  };
  this.activate = function () {
    isActive = true;
    Object.keys(timeouts).forEach(id => {
      var timeout = timeouts[id];
      var { callback, delay, args } = timeout;
      var newId = this.setTimeout(callback, delay, ...args);
      map[id] = newId;
      delete timeouts[id];
    });
    Object.keys(intervals).forEach(id => {
      var target = intervals[id];
      var { callback, interval, args, leftTime } = target;
      var newId = setTimeout(() => {
        callback(...args);
        var realNewId = this.setInterval(callback, interval, ...args);
        map[newId] = realNewId;
      }, leftTime);
      map[id] = newId;
      delete intervals[id];
    });
  };
};
