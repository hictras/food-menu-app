// Minimal service worker — ONLY for push notifications.
// NO fetch handler → browser fetches everything fresh (no stale cache).

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || "Menu", {
      body: data.body || "New recipe added",
      icon: data.icon || "/icon-192.png",
      badge: data.badge || "/icon-192.png",
      // Force the URL to be the inbox
      data: { url: "/inbox" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  // When clicked, open the app at the inbox
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // If the app is already open, just focus it and navigate to inbox
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate("/inbox");
          return client.focus();
        }
      }
      // If the app is closed, open a new window at the inbox
      if (clients.openWindow) {
        return clients.openWindow("/inbox");
      }
    })
  );
});
