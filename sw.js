/* BoraDiploma Escola - Service Worker (PWA)
   Faz o app abrir mesmo sem internet (guarda os arquivos no aparelho)
   e, mais pra frente, vai receber os lembretes de prazo (push).
   Troque a versao do cache sempre que publicar uma atualizacao. */

const CACHE = 'bdescola-v38';

// Arquivos que ficam guardados pra abrir offline (o "esqueleto" do app).
// O app.html (grande, ~12 MB) entra no cache na 1a vez que abrir.
const APP_SHELL = [
  './',
  './app.html',
  './como-funciona.html',
  './escola-config.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.indexOf('bdescola-') === 0 && k !== CACHE).map((k) => caches.delete(k)))  // so os caches do Escola (o app da faculdade fica no mesmo endereco)
    )
  );
  self.clients.claim();
});

// Estrategia: tenta a rede; se falhar (sem internet), usa o que esta guardado.
// Para a PAGINA principal (navegacao / app.html / index), forcamos buscar da rede
// SEM usar o cache do proprio navegador (cache:'no-store'). Sem isso, o celular
// podia abrir uma versao velha por ate 10 min (cache HTTP do GitHub Pages) mesmo
// com internet — era o que prendia as correcoes/traducao.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  var url;
  try { url = new URL(req.url); } catch (e) { url = { pathname: '' }; }
  var isDoc = (req.mode === 'navigate') ||
              /(^|\/)(app\.html|index\.html|)$/.test(url.pathname);
  var netReq = isDoc ? new Request(req.url, { cache: 'no-store' }) : req;
  event.respondWith(
    fetch(netReq)
      .then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./app.html')))
  );
});

// --- Avisos da agenda (push) --- enviados pela funcao enviar-lembretes do Supabase ---
self.addEventListener('push', (event) => {
  let data = { title: 'BoraDiploma Escola', body: 'Voce tem um compromisso chegando.' };
  try { if (event.data) data = event.data.json(); } catch (e) {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'BoraDiploma Escola', {
      body: data.body || '',
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      tag: data.tag || undefined,
      renotify: !!data.tag,
      vibrate: [200, 100, 200],
      data: { url: data.url || './app.html', t: data.title || '', b: data.body || '', g: data.tag || '' }
    })
  );
});

// tocar na notificacao: abre a agenda no compromisso (se o app ja estiver aberto, so avisa a pagina)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  var d = event.notification.data || {};
  if (typeof d === 'string') d = { url: d };
  var info = { t: d.t || event.notification.title || '', b: d.b || event.notification.body || '', g: d.g || event.notification.tag || '' };
  var url = (d.url || './app.html').split('#')[0] + '#notif=' + encodeURIComponent(JSON.stringify(info));
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      for (const c of lista) { if ('focus' in c) { c.postMessage({ bdNotif: info }); return c.focus(); } }
      return clients.openWindow(url);
    })
  );
});
