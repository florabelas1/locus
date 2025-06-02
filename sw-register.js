if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service worker registrado'))
      .catch(err => console.log('Erro ao registrar service worker', err));
  });
}
