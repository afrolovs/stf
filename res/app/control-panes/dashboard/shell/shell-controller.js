module.exports = function ShellCtrl($scope, $rootScope, $timeout) {
  $scope.result = null;
  $scope.data = '';

  // Безопасное обновление scope
  function safeApply(fn) {
    const phase = $scope.$root.$$phase;
    if (phase === '$apply' || phase === '$digest') {
      if (fn) { fn(); }
    } else {
      $scope.$apply(fn);
    }
  }

  // Общая функция для безопасного обновления данных
  function updateScope(data) {
    safeApply(() => {
      if (data.result) $scope.result = data.result;
      if (data.text) $scope.data = data.text;
    });
  }

  function checkAnyAppInstalled() {
    return new Promise((resolve) => {
      const packages = ['ru.more.play', 'ru.more.play.debug'];
      Promise.all(packages.map(pkg =>
        $scope.control.shell(`pm list packages ${pkg}`)
          .then(result => ({
            pkg,
            installed: result.data.join('').includes(pkg)
          }))
          .catch(() => ({ pkg, installed: false }))
      ))
        .then(results => {
          const installedApps = results.filter(r => r.installed);
          safeApply(() => {
            resolve({
              anyInstalled: installedApps.length > 0,
              installedApps: installedApps.map(r => r.pkg)
            });
          });
        });
    });
  }

  $scope.openDeepLink = function (deeplinkUrl) {
    // Формируем shell-команду для открытия deeplink'а
    const command = `am start -a android.intent.action.VIEW -d "${deeplinkUrl}"`;
    console.log('Executing deeplink command:', command);

    // Очищаем предыдущие результаты
    $scope.clear();

    // Выполняем команду через shell
    return $scope.control.shell(command)
      .progressed(function (result) {
        safeApply(function () {
          $scope.result = result;
          $scope.data = result.data.join('');
        });
      })
      .then(function (result) {
        safeApply(function () {
          $scope.result = result;
          $scope.data = result.data.join('');
        });
      });
  };

  $rootScope.resetAndLaunchOkko = function () {
    return new Promise((resolve) => {
      safeApply(() => {
        $scope.data = 'Проверка установленных приложений...';
      });

      checkAnyAppInstalled()
        .then(({ anyInstalled, installedApps }) => {
          if (!anyInstalled) {
            safeApply(() => {
              $scope.data = 'Ни один пакет Okko не найден на устройстве';
            });
            return resolve(false);
          }

          safeApply(() => {
            $scope.data = `Найден пакет: ${installedApps.join(', ')}, чистим его кэш и данные`;
          });

          const operationPromises = installedApps.map(pkg =>
            $scope.control.shell(`pm clear ${pkg} && am force-stop ${pkg}`)
              .then(() => $scope.control.shell(`monkey -p ${pkg} -c android.intent.category.LAUNCHER 1`))
              .then(() => {
                safeApply(() => {
                  $scope.data = `${pkg} успешно сброшен и запущен`;
                });
                return true;
              })
              .catch(error => {
                safeApply(() => {
                  $scope.data = `Ошибка для ${pkg}: ${error.message || error}`;
                });
                return false;
              })
          );

          return Promise.all(operationPromises)
            .then(results => {
              const allSuccess = results.every(Boolean);
              safeApply(() => {
                $scope.data = allSuccess
                  ? 'Приложение сброшено, запускаем :)'
                  : 'Не удалось сбросить состояние приложения Okko. Попробуйте сделать это вручную через настройки, и убедитесь, что приложение установлено';
              });
              resolve(allSuccess);
            });
        })
        .catch(error => {
          safeApply(() => {
            $scope.data = `Ошибка: ${error.message || error}`;
          });
          resolve(false);
        });
    });
  };

  $rootScope.launchOkko = function () {
    return new Promise((resolve) => {
      safeApply(() => {
        $scope.data = 'Проверка установленных приложений...';
      });

      checkAnyAppInstalled()
        .then(({ anyInstalled, installedApps }) => {
          if (!anyInstalled) {
            safeApply(() => {
              $scope.data = 'Приложение Okko не найдено на устройстве. Самое время его установить!';
            });
            return resolve(false);
          }

          safeApply(() => {
            $scope.data = `Запускаем приложение: ${installedApps.join(', ')}`;
          });

          const launchPromises = installedApps.map(pkg =>
            $scope.control.shell(`monkey -p ${pkg} -c android.intent.category.LAUNCHER 1`)
              .then(() => {
                safeApply(() => {
                  $scope.data = `${pkg} успешно запущен`;
                });
                return true;
              })
              .catch(error => {
                safeApply(() => {
                  $scope.data = `Ошибка запуска ${pkg}: ${error.message || error}`;
                });
                return false;
              })
          );

          return Promise.all(launchPromises)
            .then(results => {
              const allLaunched = results.every(Boolean);
              safeApply(() => {
                $scope.data = allLaunched
                  ? 'Приложение Okko запущено, приятной отладки :)'
                  : 'Не удалось запустить приложение Okko. Убедитесь, что оно установлено';
              });
              resolve(allLaunched);
            });
        })
        .catch(error => {
          safeApply(() => {
            $scope.data = `Ошибка: ${error.message || error}`;
          });
          resolve(false);
        });
    });
  };

  $rootScope.uninstallOkko = function () {
    return new Promise((resolve) => {
      safeApply(() => {
        $scope.data = 'Проверка установленных приложений...';
      });

      checkAnyAppInstalled()
        .then(({ anyInstalled, installedApps }) => {
          if (!anyInstalled) {
            safeApply(() => {
              $scope.data = 'Приложение Okko не найдено на устройстве ;(';
            });
            return resolve(false);
          }

          safeApply(() => {
            $scope.data = `Найдены приложения для удаления: ${installedApps.join(', ')}`;
          });

          const removalPromises = installedApps.map(pkg =>
            $scope.control.uninstall(pkg)
              .then(() => $scope.control.shell(`pm list packages ${pkg}`))
              .then(checkResult => {
                const success = !checkResult.data.join('').includes(pkg);
                safeApply(() => {
                  $scope.data = success
                    ? `${pkg} успешно удален`
                    : `Не удалось удалить ${pkg}`;
                });
                return success;
              })
              .catch(() => {
                safeApply(() => {
                  $scope.data = `Ошибка удаления ${pkg}`;
                });
                return false;
              })
          );

          return Promise.all(removalPromises)
            .then(results => {
              const allRemoved = results.every(Boolean);
              safeApply(() => {
                $scope.data = allRemoved
                  ? 'Все пакеты приложения Okko успешно удалены с девайса'
                  : 'Не удалось удалить приложение Okko с девайса. Попробуйте сделать это через вручную - через настройки';
              });
              resolve(allRemoved);
            });
        })
        .catch(error => {
          safeApply(() => {
            $scope.data = `Ошибка: ${error.message || error}`;
          });
          resolve(false);
        });
    });
  };

  // Вспомогательные методы
  $scope.clear = function () {
    safeApply(() => {
      $scope.command = '';
      $scope.data = '';
      $scope.result = null;
    });
  };
};