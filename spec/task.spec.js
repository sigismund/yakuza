'use strict';

var Task = require('../task');
var Q = require('q');

describe('Task', function () {
  var task;

  beforeEach(function () {
    task = new Task(function () {
      return 0;
    }, {a: 1, b: 2});
  });

  describe('#Task', function () {
    it('should initialize with 0 retries', function () {
      expect(task._retries).toBe(0);
    });

    it('should initialize with a deferred object', function () {
      expect(JSON.stringify(task._runningDeferred)).toEqual(JSON.stringify(Q.defer()));
    });

    it('should set main method if passed', function () {
      var mainMethod = function () {return 1;};
      var newTask = new Task(mainMethod);
      expect(newTask._main).toBe(mainMethod);
    });
  });

  describe('#_run', function () {
    it('should pass param callbacks as an object with keys to main method', function () {
      var emitter = {
        success: task._onSuccess,
        fail: task._onFail,
        share: task._onShare
      };
      spyOn(task, '_main');
      task._run();
      expect(task._main).toHaveBeenCalledWith(emitter, jasmine.any(Object));
    });

    it('should pass task params as second argument to main method', function () {
      var dummyFunction = function () {};
      spyOn(task, '_main');
      task._run(dummyFunction, dummyFunction, dummyFunction);
      expect(task._main).toHaveBeenCalledWith(jasmine.any(Object), task._params);
    });
  });

  describe('#_onShare', function () {
    it('should set value to the key passed in _sharedStorage', function () {
      task._onShare('foo', 1);
      task._onShare('bar', 'value');
      task._onShare('hello', {a: 1, b: 'test'});
      task._onShare('overwritten', 1);
      task._onShare('overwritten', 2);
      expect(task._sharedStorage.foo).toEqual(1);
      expect(task._sharedStorage.bar).toEqual('value');
      expect(task._sharedStorage.hello).toEqual({a: 1, b: 'test'});
      expect(task._sharedStorage.overwritten).toEqual(2);
    });
  });

  describe('#_onSuccess', function () {
    it('should resolve its running promise', function () {
      var response = {test: 'stuff'};
      spyOn(task._runningDeferred, 'resolve');
      spyOn(task._runningDeferred, 'reject');
      task._onSuccess(response);
      expect(task._runningDeferred.resolve).toHaveBeenCalledWith(response, jasmine.any(Object));
      expect(task._runningDeferred.reject).not.toHaveBeenCalled();
    });

    it('should pass its shared storage in the resolve response', function () {
      spyOn(task._runningDeferred, 'resolve');
      task._sharedStorage = {a: 1};
      task._onSuccess(1);
      expect(task._runningDeferred.resolve).toHaveBeenCalledWith(1, task._sharedStorage);
    });
  });

  describe('#_onFail', function () {
    it('it should reject its running promise', function () {
      spyOn(task._runningDeferred, 'resolve');
      spyOn(task._runningDeferred, 'reject');
      task._onFail();
      expect(task._runningDeferred.resolve).not.toHaveBeenCalled();
      expect(task._runningDeferred.reject).toHaveBeenCalled();
    });

    it('it should pass the error and message in the reject response', function () {
      var error = new Error('test error');
      var message = 'test message';
      spyOn(task._runningDeferred, 'reject');
      task._onFail(error, message);
      expect(task._runningDeferred.reject).toHaveBeenCalledWith(error, message);
    });
  });
});
