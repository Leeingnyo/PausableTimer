var PausableTimer = function () {
  // internal
  this._isActive = true;

  // for timeouts and intervals
  this._timeouts = {};
  this._intervals = {};
  this._map = {};

  // for timer
  this._origin = this.getTime();
  this._deactivatedTime = 0; // 시간
  this._deactivatedTimeSet = null; // 시각
};

PausableTimer.prototype.isActive = function () {
  return this._isActive;
};

PausableTimer.prototype.getTime = performance ? performance.now.bind(performance) : () => +new Date();
PausableTimer.prototype.now = function () {
  var now = this.getTime() - this._origin - this._deactivatedTime;
  if (this._deactivatedTimeSet) return now - (this.getTime() - this._deactivatedTimeSet);
  return now;
};
PausableTimer.prototype.lifeTime = function () {
  return this.getTime() - this._origin;
};
PausableTimer.prototype.reset = function () {
  this._deactivatedTime = this.lifeTime();
};
PausableTimer.prototype.resetHard = function () {
  this._origin = this.getTime();
  this._deactivatedTime = 0;
  this._deactivatedTimeSet = null;
};

PausableTimer.prototype.traceId = function (id) {
  if (this._map[id]) return this.traceId(this._map[id]);
  return id;
};

PausableTimer.prototype.setTimeout = function (callback, delay = 0, ...args) {
  var id = setTimeout((...args) => {
    callback.bind(null)(...args);
    delete this._timeouts[id];
  }, delay, ...args);
  this._timeouts[id] = {
    callback,
    delay,
    args,
    timestamp: this.getTime()
  };
  if (!this._isActive) {
    clearTimeout(id);
  }
  return id;
};
PausableTimer.prototype.clearTimeout = function (id) {
  id = this.traceId(id);
  clearTimeout(id);
  delete this._timeouts[id];
};
PausableTimer.prototype.setInterval = function (callback, interval = 0, ...args) {
  var id = setInterval((...args) => {
    callback.bind(null)(...args);
  }, interval, ...args);
  this._intervals[id] = {
    callback,
    interval,
    args,
    timestamp: this.getTime()
  };
  if (!this._isActive) {
    clearInterval(id);
  }
  return id;
};
PausableTimer.prototype.clearInterval = function (id) {
  id = this.traceId(id);
  clearInterval(id);
  delete this._intervals[id];
};

PausableTimer.prototype.deactivate = function () {
  Object.keys(this._timeouts).forEach(id => {
    var timeout = this._timeouts[id];
    timeout.delay -= this.getTime() - timeout.timestamp;
    clearTimeout(id);
  });
  Object.keys(this._intervals).forEach(id => {
    var interval = this._intervals[id];
    interval.leftTime = interval.interval - (this.getTime() - interval.timestamp) % interval.interval;
    clearInterval(id);
  });
  this._isActive = false;
  this._deactivatedTimeSet = this.getTime();
};
PausableTimer.prototype.activate = function () {
  this._isActive = true;
  this._deactivatedTime += this.getTime() - this._deactivatedTimeSet;
  this._deactivatedTimeSet = 0;
  Object.keys(this._timeouts).forEach(id => {
    var timeout = this._timeouts[id];
    var { callback, delay, args } = timeout;
    var newId = this.setTimeout(callback, delay, ...args);
    this._map[id] = newId;
    delete this._timeouts[id];
  });
  Object.keys(this._intervals).forEach(id => {
    var target = this._intervals[id];
    var { callback, interval, args, leftTime } = target;
    var newId = setTimeout(() => {
      callback(...args);
      var realNewId = this.setInterval(callback, interval, ...args);
      this._map[newId] = realNewId;
    }, leftTime);
    this._map[id] = newId;
    delete this._intervals[id];
  });
};
