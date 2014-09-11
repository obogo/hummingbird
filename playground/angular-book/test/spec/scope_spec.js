/* jshint globalstrict: true */
/* global it, beforeEach, describe, expect, angular: false, jasmine: false, _: false */
'use strict';
describe("Scope", function () {
    it("can be constructed and used as an object", function () {
        var scope = new angular.Scope();
        scope.aProperty = 1;
        expect(scope.aProperty).toBe(1);
    });

    describe('digest', function () {
        var scope, Scope = angular.Scope;

        beforeEach(function () {
            scope = new Scope();
        });

        it("calls the listener function of a watch on first $digest", function () {
            var watchFn = function () {
                return 'wat';
            };
            var listenerFn = jasmine.createSpy();
            scope.$watch(watchFn, listenerFn);
            scope.$digest();
            expect(listenerFn).toHaveBeenCalled();
        });
//
        it("calls the watch function with the scope as the argument", function () {
            var watchFn = jasmine.createSpy();
            var listenerFn = function () {
            };
            scope.$watch(watchFn, listenerFn);
            scope.$digest();
            expect(watchFn).toHaveBeenCalledWith(scope);
        });

        it("calls the listener function when the watched value changes", function () {
            scope.someValue = 'a';
            scope.counter = 0;
            scope.$watch(
                function (scope) {
                    return scope.someValue;
                }, function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            expect(scope.counter).toBe(0);
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.someValue = 'b';
            expect(scope.counter).toBe(1);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it("calls listener when watch value is first undefined", function () {
            scope.counter = 0;
            scope.$watch(
                function (scope) {
                    return scope.someValue;
                }, function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it("calls listener with new value as old value the first time", function () {
            scope.someValue = 123;
            var oldValueGiven;
            scope.$watch(
                function (scope) {
                    return scope.someValue;
                },
                function (newValue, oldValue, scope) {
                    oldValueGiven = oldValue;
                }
            );
            scope.$digest();
            expect(oldValueGiven).toBe(123);
        });

        it("may have watchers that omit the listener function", function () {
            var watchFn = jasmine.createSpy().and.returnValue('something');
            scope.$watch(watchFn);
            scope.$digest();
            expect(watchFn).toHaveBeenCalled();
        });

        it("triggers chained watchers in the same digest", function () {
            scope.name = 'Jane';
            scope.$watch(
                function (scope) {
                    return scope.nameUpper;
                }, function (newValue, oldValue, scope) {
                    if (newValue) {
                        scope.initial = newValue.substring(0, 1) + '.';
                    }
                }
            );
            scope.$watch(
                function (scope) {
                    return scope.name;
                }, function (newValue, oldValue, scope) {
                    if (newValue) {
                        scope.nameUpper = newValue.toUpperCase();
                    }
                }
            );
            scope.$digest();
            expect(scope.initial).toBe('J.');

            scope.name = 'Bob';
            scope.$digest();
            expect(scope.initial).toBe('B.');
        });

        it("gives up on the watches after 10 iterations", function () {
            scope.counterA = 0;
            scope.counterB = 0;
            scope.$watch(
                function (scope) {
                    return scope.counterA;
                }, function (newValue, oldValue, scope) {
                    scope.counterB++;
                }
            );
            scope.$watch(
                function (scope) {
                    return scope.counterB;
                }, function (newValue, oldValue, scope) {
                    scope.counterA++;
                }
            );

            expect((function () {
                scope.$digest();
            })).toThrow();
        });

        it("ends the digest when the last watch is clean", function () {
            scope.array = _.range(100);
            var watchExecutions = 0;
            _.times(100, function (i) {
                scope.$watch(
                    function (scope) {
                        watchExecutions++;
                        return scope.array[i];
                    },
                    function (newValue, oldValue, scope) {
                    }
                );
            });
            scope.$digest();
            expect(watchExecutions).toBe(200);
            scope.array[0] = 420;
            scope.$digest();
            expect(watchExecutions).toBe(301);
        });

        it("compares based on value if enabled", function () {
            scope.aValue = [1, 2, 3];
            scope.counter = 0;
            scope.$watch(
                function (scope) {
                    return scope.aValue;
                }, function (newValue, oldValue, scope) {
                    scope.counter++;
                },
                true
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.aValue.push(4);
            scope.$digest();
            expect(scope.counter).toBe(2);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it("correctly handles NaNs", function () {
            scope.number = 0 / 0; // NaN
            scope.counter = 0;
            scope.$watch(
                function (scope) {
                    return scope.number;
                }, function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.$digest();
            expect(scope.counter).toBe(1);
        });


        it("executes $eval'ed function and returns result", function () {
            scope.aValue = 42;
            var result = scope.$eval(function (scope) {
                return scope.aValue;
            });
            expect(result).toBe(42);
        });

        it("passes the second $eval argument straight through", function () {
            scope.aValue = 42;
            var result = scope.$eval(function (scope, arg) {
                return scope.aValue + arg;
            }, 2);
            expect(result).toBe(44);
        });

        it("executes $apply'ed function and starts the digest", function () {
            scope.aValue = 'someValue';

            scope.counter = 0;
            scope.$watch(function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.$apply(function (scope) {
                scope.aValue = 'someOtherValue';

            });
            expect(scope.counter).toBe(2);
        });

        it("executes $evalAsynced function later in the same cycle", function () {
            scope.aValue = [1, 2, 3];
            scope.asyncEvaluated = false;
            scope.asyncEvaluatedImmediately = false;
            scope.$watch(
                function (scope) {
                    return scope.aValue;
                }, function (newValue, oldValue, scope) {
                    scope.$evalAsync(function (scope) {
                        scope.asyncEvaluated = true;
                    });
                    scope.asyncEvaluatedImmediately = scope.asyncEvaluated;
                }
            );
            scope.$digest();
            expect(scope.asyncEvaluated).toBe(true);
            expect(scope.asyncEvaluatedImmediately).toBe(false);
        });

        it("executes $evalAsynced functions added by watch functions", function () {
            scope.aValue = [1, 2, 3];
            scope.asyncEvaluated = false;
            scope.$watch(function (scope) {
                    if (!scope.asyncEvaluated) {
                        scope.$evalAsync(function (scope) {
                            scope.asyncEvaluated = true;
                        });
                    }
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                });
            scope.$digest();
            expect(scope.asyncEvaluated).toBe(true);
        });

        it("executes $evalAsynced functions even when not dirty", function () {
            scope.aValue = [1, 2, 3];
            scope.asyncEvaluatedTimes = 0;
            scope.$watch(function (scope) {
                    if (scope.asyncEvaluatedTimes < 2) {
                        scope.$evalAsync(function (scope) {
                            scope.asyncEvaluatedTimes++;
                        });
                    }
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                });
            scope.$digest();
            expect(scope.asyncEvaluatedTimes).toBe(2);
        });

        it("eventually halts $evalAsyncs added by watches", function () {
            scope.aValue = [1, 2, 3];
            scope.$watch(function (scope) {
                    scope.$evalAsync(function (scope) {
                    });
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                });
            expect(function () {
                scope.$digest();
            }).toThrow();
        });

        it("has a $$phase field whose value is the current digest phase", function () {
            scope.aValue = [1, 2, 3];
            scope.phaseInWatchFunction = undefined;
            scope.phaseInListenerFunction = undefined;
            scope.phaseInApplyFunction = undefined;

            scope.$watch(
                function (scope) {
                    scope.phaseInWatchFunction = scope.$p;
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.phaseInListenerFunction = scope.$p;
                }
            );

            scope.$apply(function (scope) {
                scope.phaseInApplyFunction = scope.$p;
            });

            expect(scope.phaseInWatchFunction).toBe('$digest');
            expect(scope.phaseInListenerFunction).toBe('$digest');
            expect(scope.phaseInApplyFunction).toBe('$apply');
        });

        it("schedules a digest in $evalAsync", function (done) {
            scope.aValue = "abc";
            scope.counter = 0;

            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            scope.$evalAsync(function (scope) {
            });
            expect(scope.counter).toBe(0);

            setTimeout(function () {
                expect(scope.counter).toBe(1);
                done();
            }, 50);
        });

        it("Runs a $$postDigest function after each digest", function () {
            scope.counter = 0;
            scope.$$postDigest(function () {
                scope.counter++;
            });

            expect(scope.counter).toBe(0);
            scope.$digest();

            expect(scope.counter).toBe(1);
            scope.$digest();

            expect(scope.counter).toBe(1);
        });

        it("does not include $$postDigest in the digest", function () {
            scope.aValue = 'original value';

            scope.$$postDigest(function () {
                scope.aValue = 'changed value';
            });
            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.watchedValue = newValue;
                }
            );

            scope.$digest();
            expect(scope.watchedValue).toBe('original value');

            scope.$digest();
            expect(scope.watchedValue).toBe('changed value');
        });

        it("catches exceptions in watch functions and continues", function () {
            scope.aValue = 'abc';
            scope.counter = 0;

            scope.$watch(
                function (scope) {
                    throw "error";
                },
                function (newValue, oldValue, scope) {
                }
            );
            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it("catches exceptions in listener functions and continues", function () {
            scope.aValue = 'abc';
            scope.counter = 0;

            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    throw "Error";
                }
            );
            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it("catches exceptions in $evalAsync", function (done) {
            scope.aValue = 'abc';
            scope.counter = 0;

            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            scope.$evalAsync(function (scope) {
                throw "Error";
            });

            setTimeout(function () {
                expect(scope.counter).toBe(1);
                done();
            }, 50);
        });

        it("catches exceptions in $$postDigest", function () {
            var didRun = false;

            scope.$$postDigest(function () {
                throw "Error";
            });
            scope.$$postDigest(function () {
                didRun = true;
            });

            scope.$digest();

            expect(didRun).toBe(true);
        });

        it("allows destroying a $watch with a removal function", function () {
            scope.aValue = 'abc';
            scope.counter = 0;

            var destroyWatch = scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.aValue = 'def';
            scope.$digest();
            expect(scope.counter).toBe(2);

            scope.aValue = 'ghi';
            destroyWatch();
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it("allows destroying a $watch during digest", function () {
            scope.aValue = 'abc';

            var watchCalls = [];

            scope.$watch(
                function (scope) {
                    watchCalls.push('first');
                    return scope.aValue;
                }
            );

            var destroyWatch = scope.$watch(
                function (scope) {
                    watchCalls.push('second');
                    destroyWatch();
                }
            );

            scope.$watch(
                function (scope) {
                    watchCalls.push('third');
                    return scope.aValue;
                }
            );

            scope.$digest();
            expect(watchCalls).toEqual(['first', 'second', 'third', 'first', 'third']);
        });

        it("allows a $watch to destroy another during digest", function () {
            scope.aValue = 'abc';
            scope.counter = 0;

            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    destroyWatch();
                }
            );

            var destroyWatch = scope.$watch(
                function (scope) {
                },
                function (newValue, oldValue, scope) {
                }
            );

            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it("allows destroying several $watches during digest", function () {
            scope.aValue = 'abc';
            scope.counter = 0;

            var destroyWatch1 = scope.$watch(
                function (scope) {
                    destroyWatch1();
                    destroyWatch2();
                }
            );
            var destroyWatch2 = scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            scope.$digest();
            expect(scope.counter).toBe(0);
        });
    });

    describe("inheritance", function () {
        var parent;
        var Scope = angular.Scope;

        beforeEach(function () {
            parent = new Scope();
        });

        it("inherits the parent's properties", function () {
            parent.aValue = [1, 2, 3];

            var child = parent.$new();

            expect(child.aValue).toEqual([1, 2, 3]);
        });

        it("does not cause a parent to inherit its properties", function () {
            var child = parent.$new();
            child.aValue = [1, 2, 3];

            expect(parent.aValue).toBeUndefined();
        });

        it("inherits the parent's properties whenever they are defined", function () {
            var child = parent.$new();

            parent.aValue = [1, 2, 3];

            expect(child.aValue).toEqual([1, 2, 3]);
        });

        it("can manipulate a parent scope's property", function () {
            var child = parent.$new();

            parent.aValue = [1, 2, 3];
            child.aValue.push(4);

            expect(child.aValue).toEqual([1, 2, 3, 4]);
            expect(parent.aValue).toEqual([1, 2, 3, 4]);
        });

        it("can watch a property in the parent", function () {
            var child = parent.$new();

            parent.aValue = [1, 2, 3];
            child.counter = 0;

            child.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                },
                true
            );

            child.$digest();
            expect(child.counter).toBe(1);

            parent.aValue.push(4);
            child.$digest();
            expect(child.counter).toBe(2);
        });

        it("can be nested at any depth", function () {
            var a = parent;
            var aa = a.$new();
            var aaa = aa.$new();
            var aab = aa.$new();
            var ab = a.$new();
            var abb = ab.$new();

            a.value = 1;

            expect(aa.value).toBe(1);
            expect(aaa.value).toBe(1);
            expect(aab.value).toBe(1);
            expect(ab.value).toBe(1);
            expect(abb.value).toBe(1);

            ab.anotherValue = 2;

            expect(abb.anotherValue).toBe(2);
            expect(aa.anotherValue).toBeUndefined();
            expect(aaa.anotherValue).toBeUndefined();
        });

        it("shadows a parent's property with the same name", function () {
            var child = parent.$new();

            parent.name = 'Joe';
            child.name = 'Jill';

            expect(child.name).toBe('Jill');
            expect(parent.name).toBe('Joe');
        });

        it("does not shadow members of parent scope's attributes", function () {
            var child = parent.$new();

            parent.user = {name: 'Joe'};
            child.user.name = 'Jill';

            expect(child.user.name).toBe('Jill');
            expect(parent.user.name).toBe('Jill');
        });

        it("does not digest its parent(s)", function () {
            var parent = new Scope();
            var child = parent.$new();
            parent.aValue = 'abc';
            parent.$watch(
                function (scope) {
                    return scope.aValue;
                }, function (newValue, oldValue, scope) {
                    scope.aValueWas = newValue;
                }
            );
            child.$digest();
            expect(child.aValueWas).toBeUndefined();
        });

        it("does not digest its parent(s)", function () {
            var child = parent.$new();

            parent.aValue = 'abc';
            parent.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.aValueWas = newValue;
                }
            );

            child.$digest();
            expect(child.aValueWas).toBeUndefined();
        });

        it("keeps a record of its children", function () {
            var child1 = parent.$new();
            var child2 = parent.$new();
            var child2_1 = child2.$new();

            expect(parent.$c.length).toBe(2);
            expect(parent.$c[0]).toBe(child1);
            expect(parent.$c[1]).toBe(child2);
            expect(child1.$c.length).toBe(0);
            expect(child2.$c.length).toBe(1);
            expect(child2.$c[0]).toBe(child2_1);
        });

        it("digests its children", function () {
            var child = parent.$new();
            parent.aValue = 'abc';

            child.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.aValueWas = newValue;
                }
            );

            parent.$digest();
            expect(child.aValueWas).toBe('abc');
        });

        it("digests from root on $apply", function () {
            var child = parent.$new();
            var child2 = child.$new();

            parent.aValue = 'abc';
            parent.counter = 0;

            parent.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            child2.$apply(function (scope) {
            });
            expect(parent.counter).toBe(1);
        });

        it("schedules a digest from root on $evalAsync", function (done) {
            var child = parent.$new();
            var child2 = child.$new();

            parent.aValue = 'abc';
            parent.counter = 0;
            parent.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            child2.$evalAsync(function (scope) {
            });
            setTimeout(function () {
                expect(parent.counter).toBe(1);
                done();
            }, 50);
        });

        it("does not have access to parent attributes when isolated", function () {
            var child = parent.$new(true);

            parent.aValue = 'abc';

            expect(child.aValue).toBeUndefined();
        });

        it("cannot watch parent attributes when isolated", function () {
            var child = parent.$new(true);

            parent.aValue = 'abc';

            child.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.aValueWas = newValue;
                }
            );

            child.$digest();
            expect(child.aValueWas).toBeUndefined();
        });

        it("digests its isolated children", function () {
            var child = parent.$new(true);

            child.aValue = 'abc';

            child.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.aValueWas = newValue;
                }
            );

            parent.$digest();
            expect(child.aValueWas).toBe('abc');
        });

        it("digests from root on $apply when isolated", function () {
            var child = parent.$new(true);
            var child2 = child.$new();

            parent.aValue = 'abc';
            parent.counter = 0;
            parent.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            child2.$apply(function (scope) {
            });
            expect(parent.counter).toBe(1);
        });


        it("schedules a digest from root on $evalAsync when isolated", function (done) {
            var child = parent.$new(true);
            var child2 = child.$new();

            parent.aValue = 'abc';
            parent.counter = 0;
            parent.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            child2.$evalAsync(function (scope) {
            });
            setTimeout(function () {
                expect(parent.counter).toBe(1);
                done();
            }, 50);
        });

        it("executes $evalAsync functions on isolated scopes", function (done) {
            var child = parent.$new(true);

            child.$evalAsync(function (scope) {
                scope.didEvalAsync = true;
            });

            setTimeout(function () {
                expect(child.didEvalAsync).toBe(true);
                done();
            }, 100);
        });

        it("executes $$postDigest functions on isolated scopes", function () {
            var child = parent.$new(true);

            child.$$postDigest(function () {
                child.didPostDigest = true;
            });
            parent.$digest();

            expect(child.didPostDigest).toBe(true);
        });

        it("is no longer digested when $destroy has been called", function () {
            var child = parent.$new();

            child.aValue = [1, 2, 3];
            child.counter = 0;
            child.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                },
                true
            );

            parent.$digest();
            expect(child.counter).toBe(1);

            child.aValue.push(4);
            parent.$digest();
            expect(child.counter).toBe(2);

            child.$destroy();
            child.aValue.push(5);
            parent.$digest();
            expect(child.counter).toBe(2);
        });

        // end of "it"
    });

    describe('events', function () {
        var Scope = angular.Scope;
        var parent;
        var scope;
        var child;
        var isolatedChild;

        beforeEach(function () {
            parent = new Scope();
            scope = parent.$new();
            child = scope.$new();
            isolatedChild = scope.$new(true);
        });

        it("allows registering listeners", function () {
            var listener1 = function () {
            };
            var listener2 = function () {
            };
            var listener3 = function () {
            };

            scope.$on('someEvent', listener1);
            scope.$on('someEvent', listener2);
            scope.$on('someOtherEvent', listener3);

            expect(scope.$l).toEqual({
                someEvent: [listener1, listener2],
                someOtherEvent: [listener3]
            });
        });

        it("registers different listeners for every scope", function () {
            var listener1 = function () {
            };
            var listener2 = function () {
            };
            var listener3 = function () {
            };

            scope.$on('someEvent', listener1);
            child.$on('someEvent', listener2);
            isolatedChild.$on('someEvent', listener3);

            expect(scope.$l).toEqual({someEvent: [listener1]});
            expect(child.$l).toEqual({someEvent: [listener2]});
            expect(isolatedChild.$l).toEqual({someEvent: [listener3]});
        });

        var method;
        var list = '$emit $broadcast'.split(' ');
        for (var e in list) {
            method = list[e];

            it("calls listeners registered for matching events on " + method, function () {
                var listener1 = jasmine.createSpy();
                var listener2 = jasmine.createSpy();

                scope.$on('someEvent', listener1);
                scope.$on('someOtherEvent', listener2);

                scope[method]('someEvent');

                expect(listener1).toHaveBeenCalled();
                expect(listener2).not.toHaveBeenCalled();
            });

            it("passes an event object with a name to listeners on " + method, function () {
                var listener = jasmine.createSpy();
                scope.$on('someEvent', listener);

                scope[method]('someEvent');

                expect(listener).toHaveBeenCalled();
                expect(listener.calls.mostRecent().args[0].name).toEqual('someEvent');
            });

            it("passes the same event object to each listener on " + method, function () {
                var listener1 = jasmine.createSpy();
                var listener2 = jasmine.createSpy();
                scope.$on('someEvent', listener1);
                scope.$on('someEvent', listener2);

                scope[method]('someEvent');

                var event1 = listener1.calls.mostRecent().args[0];
                var event2 = listener2.calls.mostRecent().args[0];
                expect(event1).toBe(event2);
            });

            it("passes additional arguments to listeners on " + method, function () {
                var listener = jasmine.createSpy();
                scope.$on('someEvent', listener);

                scope[method]('someEvent', 'and', ['additional', 'arguments'], '...');

                expect(listener.calls.mostRecent().args[1]).toEqual('and');
                expect(listener.calls.mostRecent().args[2]).toEqual(['additional', 'arguments']);
                expect(listener.calls.mostRecent().args[3]).toEqual('...');
            });

            it("returns the event object on " + method, function () {
                var returnedEvent = scope[method]('someEvent');

                expect(returnedEvent).toBeDefined();
                expect(returnedEvent.name).toEqual('someEvent');
            });

            it("can be deregistered " + method, function () {
                var listener = jasmine.createSpy();
                var deregister = scope.$on('someEvent', listener);

                deregister();

                scope[method]('someEvent');

                expect(listener).not.toHaveBeenCalled();
            });

            it("does not skip the next listener when removed on " + method, function () {
                var deregister;

                var listener = function () {
                    deregister();
                };
                var nextListener = jasmine.createSpy();

                deregister = scope.$on('someEvent', listener);
                scope.$on('someEvent', nextListener);

                scope[method]('someEvent');

                expect(nextListener).toHaveBeenCalled();
            });

            it("is sets defaultPrevented when default prevented on " + method, function () {
                var listener = function (event) {
                    event.preventDefault();
                };
                scope.$on('someEvent', listener);

                var event = scope[method]('someEvent');
                expect(event.defaultPrevented).toBe(true);
            });

            it("it does not stop on exceptions on " + method, function () {
                var listener1 = function (event) {
                    throw 'listener1 throwing an exception';
                };
                var listener2 = jasmine.createSpy();
                scope.$on('someEvent', listener1);
                scope.$on('someEvent', listener2);

                scope[method]('someEvent');

                expect(listener2).toHaveBeenCalled();
            });
            // place here
        }

        it("propagates up the scope hierarchy on $emit", function () {
            var parentListener = jasmine.createSpy();
            var scopeListener = jasmine.createSpy();

            parent.$on('someEvent', parentListener);
            scope.$on('someEvent', scopeListener);

            scope.$emit('someEvent');

            expect(scopeListener).toHaveBeenCalled();
            expect(parentListener).toHaveBeenCalled();
        });

        it("propagates the same event up on $emit", function () {
            var parentListener = jasmine.createSpy();
            var scopeListener = jasmine.createSpy();
            parent.$on('someEvent', parentListener);
            scope.$on('someEvent', scopeListener);

            scope.$emit('someEvent');

            var scopeEvent = scopeListener.calls.mostRecent().args[0];
            var parentEvent = parentListener.calls.mostRecent().args[0];
            expect(scopeEvent).toBe(parentEvent);
        });

        it("propagates down the scope hierarchy on $broadcast", function () {
            var scopeListener = jasmine.createSpy();
            var childListener = jasmine.createSpy();
            var isolatedChildListener = jasmine.createSpy();

            scope.$on('someEvent', scopeListener);
            child.$on('someEvent', childListener);
            isolatedChild.$on('someEvent', isolatedChildListener);

            scope.$broadcast('someEvent');

            expect(scopeListener).toHaveBeenCalled();
            expect(childListener).toHaveBeenCalled();
            expect(isolatedChildListener).toHaveBeenCalled();
        });

        it("propagates the same event down on $broadcast", function () {
            var scopeListener = jasmine.createSpy();
            var childListener = jasmine.createSpy();

            scope.$on('someEvent', scopeListener);
            child.$on('someEvent', childListener);

            scope.$broadcast('someEvent');

            var scopeEvent = scopeListener.calls.mostRecent().args[0];
            var childEvent = childListener.calls.mostRecent().args[0];
            expect(scopeEvent).toBe(childEvent);
        });

        it("attaches targetScope on $emit", function () {
            var scopeListener = jasmine.createSpy();
            var parentListener = jasmine.createSpy();
            scope.$on('someEvent', scopeListener);
            parent.$on('someEvent', parentListener);

            scope.$emit('someEvent');

            expect(scopeListener.calls.mostRecent().args[0].targetScope).toBe(scope);
            expect(parentListener.calls.mostRecent().args[0].targetScope).toBe(scope);
        });

        it("attaches targetScope on $broadcast", function () {
            var scopeListener = jasmine.createSpy();
            var childListener = jasmine.createSpy();
            scope.$on('someEvent', scopeListener);
            child.$on('someEvent', childListener);

            scope.$broadcast('someEvent');

            expect(scopeListener.calls.mostRecent().args[0].targetScope).toBe(scope);
            expect(childListener.calls.mostRecent().args[0].targetScope).toBe(scope);
        });

        it("attaches currentScope on $emit", function () {
            var currentScopeOnScope, currentScopeOnParent;
            var scopeListener = function (event) {
                currentScopeOnScope = event.currentScope;
            };
            var parentListener = function (event) {
                currentScopeOnParent = event.currentScope;
            };
            scope.$on('someEvent', scopeListener);
            parent.$on('someEvent', parentListener);

            scope.$emit('someEvent');

            expect(currentScopeOnScope).toBe(scope);
            expect(currentScopeOnParent).toBe(parent);
        });


        it("attaches currentScope on $broadcast", function () {
            var currentScopeOnScope, currentScopeOnChild;
            var scopeListener = function (event) {
                currentScopeOnScope = event.currentScope;
            };
            var childListener = function (event) {
                currentScopeOnChild = event.currentScope;
            };
            scope.$on('someEvent', scopeListener);
            child.$on('someEvent', childListener);

            scope.$broadcast('someEvent');

            expect(currentScopeOnScope).toBe(scope);
            expect(currentScopeOnChild).toBe(child);
        });

        it("does not propagate to parents when stopped", function () {
            var scopeListener = function (event) {
                event.stopPropagation();
            };
            var parentListener = jasmine.createSpy();
            scope.$on('someEvent', scopeListener);
            parent.$on('someEvent', parentListener);

            scope.$emit('someEvent');
            expect(parentListener).not.toHaveBeenCalled();
        });

        it("is received by listeners on current scope after being stopped", function () {
            var listener1 = function (event) {
                event.stopPropagation();
            };
            var listener2 = jasmine.createSpy();
            scope.$on('someEvent', listener1);
            scope.$on('someEvent', listener2);

            scope.$emit('someEvent');

            expect(listener2).toHaveBeenCalled();
        });

        it("fires $destroy when destroyed", function () {
            var listener = jasmine.createSpy();
            scope.$on('$destroy', listener);

            scope.$destroy();

            expect(listener).toHaveBeenCalled();
        });

        it("fires $destroy on children destroyed", function () {
            var listener = jasmine.createSpy();
            child.$on('$destroy', listener);

            scope.$destroy();

            expect(listener).toHaveBeenCalled();
        });
    });
});
