// version: 3.1.0
self.addEventListener("install", () => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

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
    data: { url: data.url || "/inbox" },
  };

  // iOS requires the badge to be set BEFORE the notification shows
  const promises = [];
  if ('setAppBadge' in self.navigator) {
    promises.push(
      self.navigator.setAppBadge(1).catch((err) => console.log('Badge error:', err))
    );
  }
  
  promises.push(self.registration.showNotification(data.title || "Menu", options));

  event.waitUntil(Promise.all(promises));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  
  // Clear the badge when the user clicks the notification
  if ('clearAppBadge' in self.navigator) {
    self.navigator.clearAppBadge().catch((err) => console.log('Clear badge error:', err));
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || "/inbox";
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (!client.url.startsWith(self.location.origin)) continue;
        client.focus();
        return clients.openWindow(absoluteUrl);
      }
      return clients.openWindow(absoluteUrl);
    })
  );
});
