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
    data: { url: data.url || "/inbox" },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Menu", options)
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/inbox";
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      // Prefer an existing same-origin window
      for (const client of clientList) {
        if (!client.url.startsWith(self.location.origin)) continue;

        // Already on the target page — just focus
        if (client.url === absoluteUrl) {
          return client.focus ? client.focus() : Promise.resolve();
        }

        // Try to navigate the existing window
        if ("navigate" in client) {
          return client.navigate(absoluteUrl).then(function (navigated) {
            if (navigated && "focus" in navigated) return navigated.focus();
            // Navigate returned null — fall back to opening
            return clients.openWindow(absoluteUrl);
          }).catch(function () {
            return clients.openWindow(absoluteUrl);
          });
        }

        // No navigate support — just focus
        return client.focus ? client.focus() : Promise.resolve();
      }

      // No existing window — open a new one
      if (clients.openWindow) return clients.openWindow(absoluteUrl);
    })
  );
});
