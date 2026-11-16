/* MafiApp · service worker mínimo.
   Existe solo para los avisos (notificaciones). No guarda nada en caché ni
   intercepta pedidos: la app se sigue cargando siempre desde la red, como antes. */
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener("push", function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; }
  catch (x) { d = { notification: { title: "MafiApp", body: e.data ? e.data.text() : "" } }; }
  var n = (d && d.notification) || d || {};
  e.waitUntil(self.registration.showNotification(n.title || "MafiApp", {
    body: n.body || "",
    icon: "icon.png",
    badge: "icon.png",
    tag: "mafiapp",
    lang: "es",
    data: { url: n.navigate || "./" }
  }));
});

self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || "./";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (cs) {
    for (var i = 0; i < cs.length; i++) { if ("focus" in cs[i]) return cs[i].focus(); }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  }));
});
