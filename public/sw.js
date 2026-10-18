self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", function (event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Menu", body: event.data ? event.data.text() : "New update" };
  }

  const options = {
    body: data.body || "New update from Menu",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200, 100, 200],
    data: { url: "/inbox" }, // Always open inbox
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Menu", options)
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate("/inbox");
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow("/inbox");
    })
  );
});
