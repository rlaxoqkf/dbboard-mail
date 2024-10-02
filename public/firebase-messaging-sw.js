self.addEventListener('push', function(event) {
    console.log('[Service Worker] Push Received.');
    const payload = event.data.json();  // Assuming the payload is sent as JSON
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        title: payload.notification.title,
        body: payload.notification.body,
        icon: 'icons/192x192.png',
        //sound: 'default'
        //icon: payload.notification.icon,
        //image: payload.notification.image,
        //badge: payload.notification.badge,
    };
    event.waitUntil(
        self.registration.showNotification(notificationTitle, notificationOptions)
    );
});
