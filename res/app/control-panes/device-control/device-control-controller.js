var _ = require('lodash')

module.exports = function DeviceControlCtrl($scope, DeviceService, GroupService,
  $location, $timeout, $window, $rootScope, LogcatService) {

  $scope.showScreen = true

  $scope.groupTracker = DeviceService.trackGroup($scope)

  $scope.groupDevices = $scope.groupTracker.devices

  $scope.$on('$locationChangeStart', function (event, next, current) {
    $scope.LogcatService = LogcatService
    $rootScope.LogcatService = LogcatService
  })


  $scope.getActualDisplayDimensions = function () {
    if (!$scope.device || !$scope.device.display) return { width: 0, height: 0 };

    const { width, height, rotation } = $scope.device.display;

    // Если поворот на 90° или 270°, меняем ширину и высоту местами
    const isPortrait = rotation === 0 || rotation === 180;
    return {
      width: isPortrait ? width : height,
      height: isPortrait ? height : width
    };
  };

  $scope.$watch('device.display.rotation', () => {
    const { width, height } = $scope.getActualDisplayDimensions();
    $scope.screenStyle = calculateScreenStyle(width, height);
  });

  // Инициализация и слежение за изменениями
  $scope.$watch('device.display', (display) => {
    if (!display) return;
    const { width, height } = $scope.getActualDisplayDimensions();
    $scope.screenStyle = calculateScreenStyle(width, height);
  }, true); // deep watch

  function calculateScreenStyle(width, height) {
    const maxHeight = window.innerHeight - 13 * 16; // 16 = 1em
    const maxWidth = window.innerWidth - 20 * 16; // 16 = 1em
    const aspectRatio = width / height;

    return {
      // 'max-width': `${maxWidth}px`,
      'max-height': `${maxHeight}px`,
      'aspect-ratio': aspectRatio,
    };
  }

  // Инициализация при загрузке
  if ($scope.device?.display) {
    const { width, height } = $scope.getActualDisplayDimensions();
    $scope.screenStyle = calculateScreenStyle(width, height);
  }

  // $scope.kickDevice = function(device) {
  //   if (Object.keys(LogcatService.deviceEntries).includes(device.serial)) {
  //     LogcatService.deviceEntries[device.serial].allowClean = true
  //   }

  //   $scope.LogcatService = LogcatService
  //   $rootScope.LogcatService = LogcatService

  //   if (!device || !$scope.device) {
  //     alert('No device found')
  //     return
  //   }

  //   try {
  //     // If we're trying to kick current device
  //     if (device.serial === $scope.device.serial) {

  //       // If there is more than one device left
  //       if ($scope.groupDevices.length > 1) {

  //         // Control first free device first
  //         var firstFreeDevice = _.find($scope.groupDevices, function(dev) {
  //           return dev.serial !== $scope.device.serial
  //         })
  //         $scope.controlDevice(firstFreeDevice)

  //         // Then kick the old device
  //         GroupService.kick(device).then(function() {
  //           $scope.$digest()
  //         })
  //       } else {
  //         // Kick the device
  //         GroupService.kick(device).then(function() {
  //           $scope.$digest()
  //         })
  //         $location.path('/devices/')
  //       }
  //     } else {
  //       GroupService.kick(device).then(function() {
  //         $scope.$digest()
  //       })
  //     }
  //   } catch (e) {
  //     alert(e.message)
  //   }
  // }

  $scope.controlDevice = function (device) {
    $location.path('/control/' + device.serial)
  }

  // function isPortrait(val) {
  //   var value = val
  //   if (typeof value === 'undefined' && $scope.device) {
  //     value = $scope.device.display.rotation
  //   }
  //   return (value === 0 || value === 180)
  // }

  // function isLandscape(val) {
  //   var value = val
  //   if (typeof value === 'undefined' && $scope.device) {
  //     value = $scope.device.display.rotation
  //   }
  //   return (value === 90 || value === 270)
  // }

  // $scope.tryToRotate = function(rotation) {
  //   if (rotation === 'portrait') {
  //     $scope.control.rotate(0)
  //     $timeout(function() {
  //       if (isLandscape()) {
  //         $scope.currentRotation = 'landscape'
  //       }
  //     }, 400)
  //   } else if (rotation === 'landscape') {
  //     $scope.control.rotate(90)
  //     $timeout(function() {
  //       if (isPortrait()) {
  //         $scope.currentRotation = 'portrait'
  //       }
  //     }, 400)
  //   }
  // }

  // $scope.currentRotation = 'portrait'

  // $scope.$watch('device.display.rotation', function(newValue) {
  //   if (isPortrait(newValue)) {
  //     $scope.currentRotation = 'portrait'
  //   } else if (isLandscape(newValue)) {
  //     $scope.currentRotation = 'landscape'
  //   }
  // })

  // TODO: Refactor this inside control and server-side
  $scope.rotateLeft = function () {
    var angle = 0
    if ($scope.device && $scope.device.display) {
      angle = $scope.device.display.rotation
    }
    if (angle === 0) {
      angle = 270
    } else {
      angle -= 90
    }
    $scope.control.rotate(angle)

    if ($rootScope.standalone) {
      $window.resizeTo($window.outerHeight, $window.outerWidth)
    }
  }

  $scope.rotateRight = function () {
    var angle = 0
    if ($scope.device && $scope.device.display) {
      angle = $scope.device.display.rotation
    }
    if (angle === 270) {
      angle = 0
    } else {
      angle += 90
    }
    $scope.control.rotate(angle)

    if ($rootScope.standalone) {
      $window.resizeTo($window.outerHeight, $window.outerWidth)
    }
  }

}
