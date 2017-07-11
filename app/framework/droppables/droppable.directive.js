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