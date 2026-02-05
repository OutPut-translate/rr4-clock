// Регистрация Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => {
        console.log('✅ Service Worker зарегистрирован:', registration.scope);
        
        // Проверка обновлений
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('🔄 Обнаружено обновление Service Worker');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 Новый Service Worker готов к активации');
              
              // Можно показать уведомление об обновлении
              if (confirm('Доступна новая версия приложения. Обновить?')) {
                newWorker.postMessage({action: 'skipWaiting'});
                window.location.reload();
              }
            }
          });
        });
      })
      .catch(error => {
        console.log('❌ Ошибка регистрации Service Worker:', error);
      });

    // Проверка обновлений при фокусе
    window.addEventListener('focus', () => {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          registration.update();
        }
      });
    });
  });

  // Обработчик сообщений от Service Worker
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'RELOAD_PAGE') {
      window.location.reload();
    }
  });
}

// Проверка поддержки PWA
function checkPWASupport() {
  const supports = {
    serviceWorker: 'serviceWorker' in navigator,
    localStorage: 'localStorage' in window,
    notifications: 'Notification' in window,
    installPrompt: 'BeforeInstallPromptEvent' in window
  };
  
  console.log('Поддержка PWA:', supports);
  return supports;
}

// Запрос разрешения на уведомления
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      console.log('Разрешение на уведомления:', permission);
    });
  }
}

// Запускаем проверку
checkPWASupport();
requestNotificationPermission();