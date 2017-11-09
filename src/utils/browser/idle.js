// original src from here
// https://github.com/shawnmclean/Idle.js
// modified with dispatcher so we can listen to events.
define('idle', ['dispatcher'], function(dispatcher) {
  var Idle, events = {ON_AWAY:'onAway', ON_AWAY_BACK:'onAwayBack', ON_VISIBLE:'onVisible', ON_HIDDEN:'onHidden'};

  if (!document.addEventListener) {
    if (document.attachEvent) {
      document.addEventListener = function(event, callback, useCapture) {
        return document.attachEvent("on" + event, callback, useCapture);
      };
    } else {
      document.addEventListener = function() {
        return {};
      };
    }
  }

  if (!document.removeEventListener) {
    if (document.detachEvent) {
      document.removeEventListener = function(event, callback) {
        return document.detachEvent("on" + event, callback);
      };
    } else {
      document.removeEventListener = function() {
        return {};
      };
    }
  }

  function Idle(options) {
    this.isAway = false;
    this.awayTimeout = 5 * 60 * 1000;// default to 5m
    this.awayTimestamp = 0;
    this.awayTimer = null;
    this.events = events;
    var activeMethod, activity;
    if (options) {
      this.awayTimeout = parseInt(options.awayTimeout, 10);
    }
    dispatcher(this);
    activity = this;
    activeMethod = function() {
      return activity.onActive();
    };
    window.addEventListener('click', activeMethod, true);
    window.addEventListener('mousemove', activeMethod, true);
    window.addEventListener('mouseenter', activeMethod, true);
    window.addEventListener('keydown', activeMethod, true);
    window.addEventListener('scroll', activeMethod, true);
    window.addEventListener('mousewheel', activeMethod, true);
    window.addEventListener('touchmove', activeMethod, true);
    window.addEventListener('touchstart', activeMethod, true);
  }

  Idle.prototype.onActive = function() {
    this.awayTimestamp = new Date().getTime() + this.awayTimeout;
    if (this.isAway) {
      this.dispatch(events.ON_AWAY_BACK);
      this.start();
    }
    this.isAway = false;
    return true;
  };

  Idle.prototype.start = function() {
    var activity;
    if (!this.listener) {
      this.listener = (function() {
        return activity.handleVisibilityChange();
      });
      document.addEventListener("visibilitychange", this.listener, false);
      document.addEventListener("webkitvisibilitychange", this.listener, false);
      document.addEventListener("msvisibilitychange", this.listener, false);
    }
    this.awayTimestamp = new Date().getTime() + this.awayTimeout;
    if (this.awayTimer !== null) {
      clearTimeout(this.awayTimer);
    }
    activity = this;
    this.awayTimer = setTimeout((function() {
      return activity.checkAway();
    }), this.awayTimeout + 100);
    return this;
  };

  Idle.prototype.stop = function() {
    if (this.awayTimer !== null) {
      clearTimeout(this.awayTimer);
    }
    if (this.listener !== null) {
      document.removeEventListener("visibilitychange", this.listener);
      document.removeEventListener("webkitvisibilitychange", this.listener);
      document.removeEventListener("msvisibilitychange", this.listener);
      this.listener = null;
    }
    return this;
  };

  Idle.prototype.setAwayTimeout = function(ms) {
    this.awayTimeout = parseInt(ms, 10);
    return this;
  };

  Idle.prototype.checkAway = function() {
    var activity, t;
    t = new Date().getTime();
    if (t < this.awayTimestamp) {
      this.isAway = false;
      activity = this;
      this.awayTimer = setTimeout((function() {
        return activity.checkAway();
      }), this.awayTimestamp - t + 100);
      return;
    }
    if (this.awayTimer !== null) {
      clearTimeout(this.awayTimer);
    }
    this.isAway = true;
    this.dispatch(events.ON_AWAY);
    return this.isAway;
  };

  Idle.prototype.handleVisibilityChange = function() {
    if (document.hidden || document.msHidden || document.webkitHidden) {
      this.dispatch(events.ON_HIDDEN);
      return false;
    } else {
      this.dispatch(events.ON_VISIBLE);
      return true;
    }
  };

  return new Idle();
});