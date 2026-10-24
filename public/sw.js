// version: 3.1.1
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

  const promises = [];
  if ('setAppBadge' in self.navigator) {
    const countPromise = caches.open('badge-count').then(async (cache) => {
      const response = await cache.match('count');
      let currentCount = response ? parseInt(await response.text(), 10) : 0;
      currentCount += 1;
      await cache.put('count', new Response(currentCount.toString()));
      return self.navigator.setAppBadge(currentCount);
    }).catch((err) => console.log('Badge error:', err));
    
    promises.push(countPromise);
  }
  
  promises.push(self.registration.showNotification(data.title || "Menu", options));
  event.waitUntil(Promise.all(promises));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  
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
