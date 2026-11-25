// KNSDC Background Service Worker for Stage Call & Push Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming push messages if Web Push backend is connected
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: '🚨 STAGE CALL ALERT!', body: event.data ? event.data.text() : 'You have a new stage call update!' };
  }

  const title = data.title || '🚨 STAGE CALL ALERT!';
  const options = {
    body: data.body || 'You are UP NEXT to perform! Please report to the stage/backstage immediately.',
    icon: './logo.png',
    badge: './logo.png',
    vibrate: [500, 200, 500, 200, 500, 200, 1000],
    tag: 'knsdc-stage-alert',
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || './KNSDC-Participant.html',
      timestamp: Date.now()
    },
    actions: [
      { action: 'open', title: '👀 Open Portal' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click to bring participant portal to the front
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const targetUrl = (event.notification.data && event.notification.data.url) || './KNSDC-Participant.html';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Listen for messages from client (e.g. to trigger reliable background notification via Service Worker)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title || '🚨 STAGE CALL ALERT!', {
      icon: './logo.png',
      badge: './logo.png',
      vibrate: [500, 200, 500, 200, 500, 200, 1000],
      tag: 'knsdc-stage-alert',
      renotify: true,
      requireInteraction: true,
      ...options
    });
  }
});

// Handle PWA Web Share Target (e.g. sharing audio directly from WhatsApp or phone share sheet)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === 'POST' && (url.pathname.includes('KNSDC-Participant.html') || url.searchParams.get('shared') === '1')) {
    event.respondWith((async () => {
      try {
        const formData = await event.request.formData();
        const audioFile = formData.get('audio') || formData.get('file') || formData.get('media');
        
        if (audioFile && audioFile.size > 0) {
          const cache = await caches.open('knsdc-shared-media-v1');
          const fileBlobResponse = new Response(audioFile, {
            headers: {
              'content-type': audioFile.type || 'audio/mpeg',
              'x-shared-filename': encodeURIComponent(audioFile.name || 'whatsapp_audio.mp3'),
              'x-shared-timestamp': String(Date.now())
            }
          });
          await cache.put('/knsdc-shared-audio-temp', fileBlobResponse);
        }
      } catch (err) {
        console.warn('[SW Share Target Error]', err);
      }
      return Response.redirect('./KNSDC-Participant.html?shared=1', 303);
    })());
    return;
  }
});

