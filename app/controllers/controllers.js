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