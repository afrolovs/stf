module.exports = angular.module('control-panes', [
  require('stf/common-ui/nice-tabs').name,
  require('stf/device').name,
  require('stf/control').name,
  require('stf/scoped-hotkeys').name,
  require('./device-control').name,
  require('./advanced').name,
  require('./automation').name,
  require('./performance').name,
  require('./dashboard').name,
  require('./logs').name,
  require('./screenshots').name,
  require('./explorer').name,
  require('./info').name
])
  .config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {

    function verifyToken(token, serial) {
      try {
        const paddedToken = token + '='.repeat((4 - token.length % 4) % 4);
        const decoded = atob(paddedToken.replace(/-/g, '+').replace(/_/g, '/'));

        const parts = decoded.split(':');
        if (parts.length !== 2) return false;
        const [salt, maskedExpiryStr] = parts;
        const maskedExpiry = parseInt(maskedExpiryStr);
        const expiry = maskedExpiry ^ 0xFFFFFFFF;
        return salt === serial.substring(0, 3) && expiry > Date.now() / 1000;

      } catch (e) {
        console.error('Token verification error:', e);
        return false;
      }
    }
    $routeProvider

      .when('/watch/:serial', {
        template: require('./control-panes.pug'),
        controller: 'ControlPanesCtrl'
      })

      .when('/control/:serial/:session', {
        template: require('./control-panes.pug'),
        controller: 'ControlPanesCtrl',
        resolve: {
          sessionCheck: ['$q', '$route', '$window', function ($q, $route, $window) {
            const sessionToken = $route.current.params.session;
            const serial = $route.current.params.serial;
            console.log('Current time:', new Date());

            if (!sessionToken) {
              console.error('No token, redirecting');
              $window.location.href = '/#!/devices';
              return $q.reject();
            }

            if (verifyToken(sessionToken, serial)) {
              return $q.resolve();
            } else {
              console.error('Invalid or expired token');
              $window.location.href = '/#!/devices';
              return $q.reject();
            }
          }]
        }
      })

      .when('/forced/:serial', {
        template: require('./control-panes.pug'),
        controller: 'ControlPanesCtrl'
      })

      .otherwise({
        redirectTo: '/devices'
      });
  }])
  .factory('ControlPanesService', require('./control-panes-service'))
  .controller('ControlPanesCtrl', require('./control-panes-controller'))
  .controller('ControlPanesNoDeviceController',
    require('./control-panes-no-device-controller'))
  .controller('ControlPanesHotKeysCtrl',
    require('./control-panes-hotkeys-controller'))