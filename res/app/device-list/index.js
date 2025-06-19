require('./device-list.css')

module.exports = angular.module('device-list', [
  require('angular-xeditable').name,
  require('stf/device').name,
  require('stf/user/group').name,
  require('stf/control').name,
  require('stf/common-ui').name,
  require('stf/settings').name,
  require('./column').name,
  require('./details').name,
  require('./empty').name,
  require('./icons').name,
  require('./stats').name,
  require('./customize').name,
  require('./search').name
])
  .config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    $routeProvider
      .when('/devices', {
        template: '',
        controller: ['$window', function ($window) {
          const url = window.APP_CONFIG.deviceFarmUrl
          console.log('Redirecting to:', url)
          $window.location.href = url
        }]
      })
      .when('/devices_legacy', {
        template: require('./device-list.pug'),
        controller: 'DeviceListCtrl'
      })
  }])
  .run(function (editableOptions) {
    editableOptions.theme = 'bs3' // Стиль для xeditables
  })
  .controller('DeviceListCtrl', require('./device-list-controller'))