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