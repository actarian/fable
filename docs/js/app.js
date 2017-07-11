/* global angular */

(function() {
    "use strict";

    var app = angular.module('app', ['ngRoute', 'jsonFormatter']);

}());
/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.config(['$httpProvider', function($httpProvider) {

        // $httpProvider.defaults.withCredentials = true;

    }]);

}());
/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

        $routeProvider.when('/', {
            title: 'First',
            templateUrl: 'partials/first.html',
            controller: 'FirstCtrl',

        });

        $routeProvider.otherwise('/'); // stream

        // HTML5 MODE url writing method (false: #/anchor/use, true: /html5/url/use)
        $locationProvider.html5Mode(false);
        $locationProvider.hashPrefix('');

    }]);

}());
/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.directive('droppable', ['$parse', 'Droppables', function($parse, Droppables) {
        return {
            require: 'ngModel',
            link: function(scope, element, attributes, model) {
                var nativeElement = element[0];
                var selector = attributes.droppable || '.item';

                function onGetData() {
                    var index = $parse(attributes.droppableIndex)(scope);
                    var model = $parse(attributes.ngModel)(scope);
                    var droppable = attributes.droppableIf !== undefined ? $parse(attributes.droppableIf) : function() { return true; };
                    return {
                        index: index,
                        model: model,
                        droppable: droppable,
                    };
                }
                Droppables.add(nativeElement, onGetData);
                scope.$on('$destroy', function() {
                    Droppables.remove(nativeElement);
                });
            }
        };
    }]);

    app.service('Droppables', ['ElementRect', function(ElementRect) {
        this.natives = [];
        this.callbacks = [];
        this.rects = [];
        this.add = function(nativeElement, callback) {
            this.natives.push(nativeElement);
            this.callbacks.push(callback || function() {});
            this.rects.push(ElementRect.fromNative(nativeElement));
        };
        this.remove = function(nativeElement) {
            var index = this.natives.indexOf(nativeElement);
            if (index !== -1) {
                this.natives.splice(index, 1);
                this.callbacks.splice(index, 1);
                this.rects.splice(index, 1);
            }
        };
        this.getIntersections = function(item) {
            var intersections = [],
                element;
            angular.forEach(this.rects, function(rect, index) {
                rect.set(rect.native);
                element = angular.element(rect.native);
                element.removeClass('dropping');
                if (rect.intersect(item)) {
                    rect.distance = rect.center.distance(item.center);
                    rect.data = this.callbacks[index]();
                    intersections.push(rect);
                    element.addClass('over');
                } else {
                    element.removeClass('over');
                }
            }.bind(this));
            intersections.sort(function(a, b) {
                if (a.distance < b.distance) {
                    return -1;
                }
                if (a.distance > b.distance) {
                    return 1;
                }
                return 0;
            });
            return intersections;
        };
    }]);

    app.factory('Vector', function() {
        function Vector(x, y) {
            this.x = x || 0;
            this.y = y || 0;
        }
        Vector.make = function(a, b) {
            return new Vector(b.x - a.x, b.y - a.y);
        };
        Vector.size = function(a) {
            return Math.sqrt(a.x * a.x + a.y * a.y);
        };
        Vector.normalize = function(a) {
            var l = Vector.size(a);
            a.x /= l;
            a.y /= l;
            return a;
        };
        Vector.incidence = function(a, b) {
            var angle = Math.atan2(b.y, b.x) - Math.atan2(a.y, a.x);
            // if (angle < 0) angle += 2 * Math.PI;
            // angle = Math.min(angle, (Math.PI * 2 - angle));
            return angle;
        };
        Vector.distance = function(a, b) {
            return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
        };
        Vector.cross = function(a, b) {
            return (a.x * b.y) - (a.y * b.x);
        };
        Vector.difference = function(a, b) {
            return new Vector(a.x - b.x, a.y - b.y);
        };
        Vector.power = function(a, b) {
            var x = Math.abs(b.x - a.x);
            var y = Math.abs(b.y - a.y);
            return (x + y) / 2;
        };
        Vector.prototype = {
            size: function() {
                return Vector.size(this);
            },
            normalize: function() {
                return Vector.normalize(this);
            },
            incidence: function(b) {
                return Vector.incidence(this, b);
            },
            cross: function(b) {
                return Vector.cross(this, b);
            },
            distance: function(b) {
                return Vector.distance(this, b);
            },
            difference: function(b) {
                return Vector.difference(this, b);
            },
            power: function() {
                return (Math.abs(this.x) + Math.abs(this.y)) / 2;
            },
            towards: function(b, friction) {
                friction = friction || 0.125;
                this.x += (b.x - this.x) * friction;
                this.y += (b.y - this.y) * friction;
                return this;
            },
            add: function(b) {
                this.x += b.x;
                this.y += b.y;
                return this;
            },
            friction: function(b) {
                this.x *= b;
                this.y *= b;
                return this;
            },
            copy: function(b) {
                return new Vector(this.x, this.y);
            },
            toString: function() {
                return '{' + this.x + ',' + this.y + '}';
            },
        };
        return Vector;
    });

    app.factory('ElementRect', ['Vector', function(Vector) {
        function ElementRect() {
            this.x = 0;
            this.y = 0;
            this.width = 0;
            this.height = 0;
            this.center = new Vector();
        }
        ElementRect.fromNative = function(nativeElement) {
            return new ElementRect().set(nativeElement);
        };
        ElementRect.prototype = {
            set: function(nativeElement) {
                var rect = nativeElement.getBoundingClientRect();
                this.x = rect.left;
                this.y = rect.top;
                this.width = nativeElement.offsetWidth;
                this.height = nativeElement.offsetHeight;
                this.center.x = this.x + this.width / 2;
                this.center.y = this.y + this.height / 2;
                this.native = nativeElement;
                return this;
            },
            offset: function(vector) {
                this.x += vector.x;
                this.y += vector.y;
                this.center.x = this.x + this.width / 2;
                this.center.y = this.y + this.height / 2;
                return this;
            },
            intersect: function(element) {
                // console.log('intersect.this', this, 'element', element);
                return !(element.x > this.x + this.width ||
                    element.x + element.width < this.x ||
                    element.y > this.y + this.height ||
                    element.y + element.height < this.y);
            },
            toString: function() {
                return '{' + this.x + ',' + this.y + ',' + this.width + ',' + this.height + '}';
            },
        };
        return ElementRect;
    }]);

    app.factory('Style', function() {
        var prefix = function detectTransformProperty() {
            var transform = 'transform',
                webkit = 'webkitTransform';
            var div = document.createElement("DIV");
            if (typeof div.style[transform] !== 'undefined') {
                ['webkit', 'moz', 'o', 'ms'].every(function(prop) {
                    var prefixed = '-' + prop + '-transform';
                    if (typeof div.style[prefixed] !== 'undefined') {
                        prefix = prefixed;
                        return false;
                    }
                    return true;
                });
            } else if (typeof div.style[webkit] !== 'undefined') {
                prefix = '-webkit-transform';
            } else {
                prefix = undefined;
            }
            return prefix;
        }();

        function Style() {
            this.props = {
                scale: 1,
                hoverScale: 1,
                currentScale: 1,
            };
        }
        Style.prototype = {
            set: function(element) {
                var styles = [];
                angular.forEach(this, function(value, key) {
                    if (key !== 'props')
                        styles.push(key + ':' + value);
                });
                element.style.cssText = styles.join(';') + ';';
            },
            transform: function(transform) {
                this[prefix] = transform;
            },
            transformOrigin: function(x, y) {
                this[prefix + '-origin-x'] = (Math.round(x * 1000) / 1000) + '%';
                this[prefix + '-origin-y'] = (Math.round(y * 1000) / 1000) + '%';
            },
        };
        Style.prefix = prefix;
        return Style;
    });

}());
/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.directive('draggable', ['$parse', '$timeout', 'Events', 'Style', 'ElementRect', 'Droppables', function($parse, $timeout, Events, Style, ElementRect, Droppables) {
        return {
            require: 'ngModel',
            link: function(scope, element, attributes, model) {
                var nativeElement = element[0];
                var selector = attributes.draggable || '.item';
                var condition = attributes.draggableIf !== undefined ? $parse(attributes.draggableIf) : function() { return true; };
                var target = nativeElement.querySelector(selector);
                var style = new Style();
                var elementRect = new ElementRect();
                var down, move, diff, dragging, rects;

                var events, dragEvents;
                var listeners = {
                    down: onDown,
                };
                var dragListeners = {
                    move: onMove,
                    up: onUp,
                };
                events = new Events(element);
                dragEvents = new Events(document);

                scope.$on('$destroy', function() {
                    removeDragListeners();
                    removeListeners();
                });
                addListeners();

                function onDown(e) {
                    if (condition(scope)) {
                        down = e.absolute;
                        addDragListeners();
                    }
                    return false;
                }

                function onMove(e) {
                    move = e.absolute;
                    diff = move.difference(down);
                    if (!dragging && diff.power() > 25) {
                        dragging = true;
                        element.addClass('dragging');
                    }
                    if (dragging) {
                        style.transform = 'translateX(' + diff.x + 'px) translateY(' + diff.y + 'px)';
                        style.set(target);
                        elementRect.set(nativeElement).offset(diff);
                        rects = Droppables.getIntersections(elementRect);
                        if (rects.length) {
                            angular.element(rects[0].native).addClass('dropping');
                        }
                    }
                    return false;
                }

                function onUp(e) {
                    if (dragging) {
                        dragging = false;
                        element.removeClass('dragging');
                        style.transform = 'none';
                        style.set(target);
                        var fromIndex = $parse(attributes.droppableIndex)(scope);
                        var fromModel = $parse(attributes.ngModel)(scope);
                        var event = null;

                        if (rects.length) {
                            angular.forEach(rects, function(rect, index) {
                                angular.element(rect.native).removeClass('dropping over');
                                if (rect.data.droppable(scope) && !event) {
                                    event = {
                                        from: {
                                            index: fromIndex,
                                            model: fromModel,
                                            target: target,
                                        },
                                        to: {
                                            index: rect.data.index,
                                            model: rect.data.model,
                                            target: rect.native
                                        },
                                    };
                                    $timeout(function() {
                                        scope.$emit('onDropItem', event);
                                    });
                                }
                            });
                        } else {
                            event = {
                                from: {
                                    index: fromIndex,
                                    model: fromModel,
                                    target: target,
                                },
                                to: null,
                            };
                            $timeout(function() {
                                scope.$emit('onDropOut', event);
                            });
                        }
                    }
                    removeDragListeners();
                    return false;
                }

                function addDragListeners() {
                    dragEvents.add(dragListeners);
                }

                function removeDragListeners() {
                    dragEvents.remove(dragListeners);
                }

                function addListeners() {
                    events.add(listeners);
                }

                function removeListeners() {
                    events.remove(listeners);
                }
            }
        };
    }]);

}());
/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.factory('Events', [function() {

        function Point(data) {
            this.x = 0;
            this.y = 0;
            if (data) {
                angular.extend(this, data);
            }
        }
        Point.prototype = {
            difference: function(p) {
                var _this = this;
                return new Point({
                    x: this.x - p.x,
                    y: this.y - p.y,
                })
            },
            power: function() {
                return (Math.abs(this.x) + Math.abs(this.y)) / 2;
            },
        };

        function Event(e, element) {
            var documentNode = (document.documentElement || document.body.parentNode || document.body);
            var scroll = {
                x: window.pageXOffset || documentNode.scrollLeft,
                y: window.pageYOffset || documentNode.scrollTop
            };
            if (e.type === 'resize') {
                var view = {
                    w: this.getWidth(),
                    h: this.getHeight(),
                };
                this.view = view;
            }
            var node = getNode(element);
            var offset = {
                x: node.offsetLeft,
                y: node.offsetTop,
            };
            var rect;
            if (node.getBoundingClientRect) {
                rect = node.getBoundingClientRect();
            } else {
                rect = { x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 };
            }

            var page = this.getPage(e);
            if (page) {
                var relative = new Point({
                    x: page.x - scroll.x - rect.left,
                    y: page.y - scroll.y - rect.top,
                });
                var absolute = new Point({
                    x: page.x - scroll.x,
                    y: page.y - scroll.y,
                });
                this.relative = relative;
                this.absolute = absolute;
            }
            if (this.type === 'resize') {
                console.log(this.type);
            }
            this.originalEvent = e;
            this.element = element;
            this.node = node;
            this.offset = offset;
            this.rect = rect;
            // console.log('Event', 'page', page, 'scroll', scroll, 'offset', offset, 'rect', rect, 'relative', relative, 'absolute', absolute);
            // console.log('scroll.y', scroll.y, 'page.y', page.y, 'offset.y', offset.y, 'rect.top', rect.top);
        }
        Event.prototype = {
            getPage: getPage,
            getWidth: getWidth,
            getHeight: getHeight,
        };

        function getWidth() {
            if (self.innerWidth) {
                return self.innerWidth;
            }
            if (document.documentElement && document.documentElement.clientWidth) {
                return document.documentElement.clientWidth;
            }
            if (document.body) {
                return document.body.clientWidth;
            }
        }

        function getHeight() {
            if (self.innerHeight) {
                return self.innerHeight;
            }
            if (document.documentElement && document.documentElement.clientHeight) {
                return document.documentElement.clientHeight;
            }
            if (document.body) {
                return document.body.clientHeight;
            }
        }

        function getPage(e) {
            var standardEvents = ['click', 'mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave', 'contextmenu'];
            var touchEvents = ['touchstart', 'touchmove', 'touchend', 'touchcancel'];
            var page = null;
            if (touchEvents.indexOf(e.type) !== -1) {
                var t = null;
                var event = e.originalEvent ? e.originalEvent : e;
                var touches = event.touches.length ? event.touches : event.changedTouches;
                if (touches && touches.length) {
                    t = touches[0];
                }
                if (t) {
                    page = {
                        x: t.pageX,
                        y: t.pageY,
                    };
                }
            } else if (standardEvents.indexOf(e.type) !== -1) {
                page = {
                    x: e.pageX,
                    y: e.pageY,
                };
            }
            this.type = e.type;
            return page;
        }

        function Events(element) {
            this.element = element;
            this.listeners = {};
            this.standardEvents = {
                click: {
                    key: 'click',
                    callback: onClick
                },
                down: {
                    key: 'mousedown',
                    callback: onMouseDown
                },
                move: {
                    key: 'mousemove',
                    callback: onMouseMove
                },
                up: {
                    key: 'mouseup',
                    callback: onMouseUp
                },
                resize: {
                    key: 'resize',
                    callback: onResize
                },
            };
            this.touchEvents = {
                down: {
                    key: 'touchstart',
                    callback: onTouchStart
                },
                move: {
                    key: 'touchmove',
                    callback: onTouchMove
                },
                up: {
                    key: 'touchend',
                    callback: onTouchEnd
                },
            };

            var scope = this;

            function onClick(e) {
                // console.log('onClick', e, scope);
                var event = new Event(e, scope.element);
                scope.listeners.click.apply(this, [event]);
            }

            function onMouseDown(e) {
                // console.log('onMouseDown', e);
                var event = new Event(e, scope.element);
                scope.listeners.down.apply(this, [event]);
                scope.removeTouchEvents();
            }

            function onMouseMove(e) {
                // console.log('onMouseMove', e);
                var event = new Event(e, scope.element);
                scope.listeners.move.apply(this, [event]);
            }

            function onMouseUp(e) {
                // console.log('onMouseUp', e);
                var event = new Event(e, scope.element);
                scope.listeners.up.apply(this, [event]);
            }

            function onResize(e) {
                console.log('onResize', e);
                var event = new Event(e, scope.element);
                scope.listeners.resize.apply(this, [event]);
            }

            function onTouchStart(e) {
                // console.log('onTouchStart', e);
                var event = new Event(e, scope.element);
                scope.listeners.down.apply(this, [event]);
                scope.removeStandardEvents();
            }

            function onTouchMove(e) {
                // console.log('onTouchMove', e);
                var event = new Event(e, scope.element);
                scope.listeners.move.apply(this, [event]);
            }

            function onTouchEnd(e) {
                // console.log('onTouchEnd', e);
                var event = new Event(e, scope.element);
                scope.listeners.up.apply(this, [event]);
            }
        }
        Events.prototype = {
            add: onAdd,
            remove: onRemove,
            removeStandardEvents: removeStandardEvents,
            removeTouchEvents: removeTouchEvents,
        };
        return Events;

        function getNode(element) {
            return element.length ? element[0] : element; // (element.length && (element[0] instanceOf Node || element[0] instanceOf HTMLElement)) ? element[0] : element;
        }

        function getElement(element) {
            return element.length ? element : angular.element(element); // (element.length && (element[0] instanceOf Node || element[0] instanceOf HTMLElement)) ? element : angular.element(element);
        }

        function onAdd(listeners) {
            var scope = this,
                standard = this.standardEvents,
                touch = this.touchEvents;
            var element = getElement(this.element),
                windowElement = angular.element(window);

            angular.forEach(listeners, function(callback, key) {
                if (scope.listeners[key]) {
                    var listener = {};
                    listener[key] = scope.listeners[key];
                    onRemove(listener);
                }
                scope.listeners[key] = callback;
                if (standard[key]) {
                    if (key === 'resize') {
                        windowElement.on(standard[key].key, standard[key].callback);
                    } else {
                        element.on(standard[key].key, standard[key].callback);
                    }
                }
                if (touch[key]) {
                    element.on(touch[key].key, touch[key].callback);
                }
            });
            return scope;
        }

        function onRemove(listeners) {
            var scope = this,
                standard = this.standardEvents,
                touch = this.touchEvents;
            var element = getElement(this.element),
                windowElement = angular.element(window);
            angular.forEach(listeners, function(callback, key) {
                if (standard[key]) {
                    if (key === 'resize') {
                        windowElement.off(standard[key].key, standard[key].callback);
                    } else {
                        element.off(standard[key].key, standard[key].callback);
                    }
                }
                if (touch[key]) {
                    element.off(touch[key].key, touch[key].callback);
                }
                scope.listeners[key] = null;
            });
            return scope;
        }

        function removeStandardEvents() {
            var scope = this,
                standard = scope.standardEvents,
                touch = scope.touchEvents;
            var element = getElement(scope.element);
            element.off('mousedown', standard.down.callback);
            element.off('mousemove', standard.move.callback);
            element.off('mouseup', standard.up.callback);
        }

        function removeTouchEvents() {
            var scope = this,
                standard = scope.standardEvents,
                touch = scope.touchEvents;
            var element = getElement(scope.element);
            element.off('touchstart', touch.down.callback);
            element.off('touchmove', touch.move.callback);
            element.off('touchend', touch.up.callback);
        }

    }]);

}());
/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.controller('RootCtrl', ['$scope', function($scope) {

    }]);

    app.controller('FirstCtrl', ['$scope', function($scope) {

        $scope.headers = [{
            name: 'Id',
            key: 'id'
        }, {
            name: 'Famiglia - Categoria',
            key: 'family'
        }, {
            name: 'Descrizione RAI',
            key: 'rai'
        }, {
            name: 'Ore',
            key: 'hours'
        }, {
            name: 'Listino',
            key: 'priceList'
        }, {
            name: 'Macrostima COM',
            key: 'com'
        }];

        $scope.items = [{
            id: 505,
            family: 'DIGITAL MARKETING - CAMPAGNA ADV - online',
            rai: 'ADV: set up campagna adv (Google e Facebook)',
            hours: 'da 40 H a 60 H',
            priceList: 'da 2.400 € a 3.600 €',
            com: '-',
        }, {
            id: 506,
            family: 'DIGITAL MARKETING - CAMPAGNA ADV - online',
            rai: 'ADV: set up campagna adv (Twitter e Instagram)',
            hours: 'da 40 H a 60 H',
            priceList: 'da 2.400 € a 3.600 €',
            com: '-',
        }];

        $scope.$on('onDropItem', function(scope, event) {
            console.log('MacroCtrl.onDropItem', event.from.model, event.to.model);
            /*
            if (event.from.model.id === event.to.model.id) {
                return;
            }
            var index = -1, from = null;
            angular.forEach(model.activities, function (item, i) {
                if (item.id === event.from.model.id) {
                    index = i;
                }
            });
            if (index !== -1) {
                var list = model.activities.splice(index, 1);
                if (list.length) {
                    from = list[0];
                }
            }
            if (from) {
                index = -1;
                angular.forEach(model.activities, function (item, i) {
                    if (item.id === event.to.model.id) {
                        index = i;
                    }
                });
                if (index !== -1) {
                    model.activities.splice(index, 0, from);
                }
                angular.forEach(model.activities, function (item, i) {
                    item.orderId = (i + 1) * 10;
                });
            }
            Api.macros.activitiesUpdate(model.activities).then(function (activities) {
                console.log('MacroCtrl.activitiesUpdate', model.activities, activities);
            });
            */
        });
        $scope.$on('onDropOut', function(scope, event) {
            console.log('MacroCtrl.onDropOut', event.model, event.from, event.to, event.target);
        });
    }]);

}());