/**
* Copyright © 2019 contains code contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

module.exports =
  function ControlPanesController($scope, $http, $window, gettext, $routeParams,
    $timeout, $location, DeviceService, GroupService, ControlService,
    StorageService, FatalMessageService, SettingsService, LogcatService) {

    $scope.showScreen = true
    $scope.isWatchMode = $location.path().includes('/watch/');

    $scope.groupTracker = DeviceService.trackGroup($scope)

    $scope.groupDevices = $scope.groupTracker.devices

    $scope.deviceControls = {
      tryToRotate: function (rotation) {
        if (!$scope.control || !$scope.device) return;

        if (rotation === 'portrait') {
          $scope.control.rotate(0);
        } else if (rotation === 'landscape') {
          $scope.control.rotate(90);
        }
      },
      currentRotation: 'portrait',

      kickDevice: function (device, $event) {
        if ($event) $event.stopPropagation();

        if (Object.keys(LogcatService.deviceEntries).includes(device.serial)) {
          LogcatService.deviceEntries[device.serial].allowClean = true;
        }

        if (!device || !$scope.device) {
          alert('No device found');
          return;
        }

        try {
          // If we're trying to kick current device
          if (device.serial === $scope.device.serial) {
            // If there is more than one device left
            if ($scope.groupDevices.length > 1) {
              // Control first free device first
              var firstFreeDevice = _.find($scope.groupDevices, function (dev) {
                return dev.serial !== $scope.device.serial;
              });
              $scope.controlDevice(firstFreeDevice);

              // Then kick the old device
              GroupService.kick(device).then(function () {
                $scope.$digest();
              });
            } else {
              // Kick the device
              GroupService.kick(device).then(function () {
                $scope.$digest();
              });
              $location.path('/devices/');
            }
          } else {
            GroupService.kick(device).then(function () {
              $scope.$digest();
            });
          }
        } catch (e) {
          alert("Девайс не ответил на попытку отключения. Ничего страшного - просто закрой окно :)");
        }
      }
    };


    var sharedTabs = [
      {
        title: gettext('Screenshots'),
        icon: 'fa-camera color-skyblue',
        templateUrl: 'control-panes/screenshots/screenshots.pug',
        filters: ['native', 'web']
      },
      {
        title: gettext('Automation'),
        icon: 'fa-road color-lila',
        templateUrl: 'control-panes/automation/automation.pug',
        filters: ['native', 'web']
      },
      {
        title: gettext('Advanced'),
        icon: 'fa-bolt color-brown',
        templateUrl: 'control-panes/advanced/advanced.pug',
        filters: ['native', 'web']
      },
      {
        title: gettext('File Explorer'),
        icon: 'fa-folder-open color-blue',
        templateUrl: 'control-panes/explorer/explorer.pug',
        filters: ['native', 'web']
      },
      {
        title: gettext('Info'),
        icon: 'fa-info color-orange',
        templateUrl: 'control-panes/info/info.pug',
        filters: ['native', 'web']
      }
    ]

    $scope.topTabs = [
      {
        title: gettext('Dashboard'),
        icon: 'fa-dashboard fa-fw color-pink',
        templateUrl: 'control-panes/dashboard/dashboard.pug',
        filters: ['native', 'web']
      }
    ].concat(angular.copy(sharedTabs))

    $scope.belowTabs = [
      {
        title: gettext('Logs'),
        icon: 'fa-list-alt color-red',
        templateUrl: 'control-panes/logs/logs.pug',
        filters: ['native', 'web']
      }
    ].concat(angular.copy(sharedTabs))

    $scope.device = null
    $scope.control = null

    // TODO: Move this out to Ctrl.resolve
    function getDevice(serial) {
      DeviceService.get(serial, $scope)
        .then(function (device) {
          return GroupService.invite(device)
        })
        .then(function (device) {
          $scope.device = device
          $scope.control = ControlService.create(device, device.channel)

          // TODO: Change title, flickers too much on Chrome
          // $rootScope.pageTitle = device.name

          SettingsService.set('lastUsedDevice', serial)

          return device
        })
        .catch(function () {
          $timeout(function () {
            $location.path('/')
          })
        })
    }

    getDevice($routeParams.serial)

    $scope.$watch('device.state', function (newValue, oldValue) {
      if (newValue !== oldValue) {
        /*************** fix bug: it seems automation state was forgotten ? *************/
        if (oldValue === 'using' || oldValue === 'automation') {
          /******************************************************************************/
          FatalMessageService.open($scope.device, false)
        }
      }
    }, true)


    // Добавляем в ControlPanesController
    $scope.isPortrait = function (val) {
      const value = val ?? $scope.device?.display?.rotation;
      return (value === 0 || value === 180);
    };

    $scope.isLandscape = function (val) {
      const value = val ?? $scope.device?.display?.rotation;
      return (value === 90 || value === 270);
    };

    $scope.tryToRotate = function (rotation) {
      if (!$scope.control || !$scope.device) return;

      if (rotation === 'portrait') {
        $scope.control.rotate(0);
      } else if (rotation === 'landscape') {
        $scope.control.rotate(90);
      }
    };

    $scope.currentRotation = 'portrait';

    $scope.$watch('device.display.rotation', function (newValue) {
      const isPortrait = newValue === 0 || newValue === 180;
      $scope.deviceControls.currentRotation = isPortrait ? 'portrait' : 'landscape';
    });

    $scope.generateWatchUrl = function () {
      return $window.location.origin + '/#!/watch/' + $routeParams.serial;
    };

    $scope.copyToClipboard = async function () {
      try {
        await navigator.clipboard.writeText($scope.generateWatchUrl());
        alert('Ссылка скопирована в буфер обмена!');
      } catch (err) {
        // Fallback для старых браузеров
        const textarea = document.createElement('textarea');
        textarea.value = $scope.generateWatchUrl();
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Ссылка скопирована!');
      }
    };

    $scope.watchUrl = $scope.generateWatchUrl();
  }