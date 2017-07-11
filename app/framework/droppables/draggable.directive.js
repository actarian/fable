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