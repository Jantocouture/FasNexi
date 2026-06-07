--- a/server/index.js
+++ b/server/index.js
@@
-// Subscribe to Redis channel for feed updates and metrics
-(async () => {
-  try {
-    const sub = connection.duplicate();
-    await sub.connect();
-    await sub.subscribe('feed:updates', (message) => {
-      try {
-        const data = JSON.parse(message);
-        const room = `profile:${data.profileId}`;
-        io.to(room).emit('feedUpdate', data);
-        console.log('emitted feedUpdate for', data.profileId);
-      } catch (e) {
-        console.error('failed to parse feed update', e);
-      }
-    });
-    await sub.subscribe('metrics', (message) => {
-      try {
-        const data = JSON.parse(message);
-        if (data && data.event === 'dlq') {
-          dlqEntries.inc();
-          console.log('metric: dlq entry for', data.queue);
-        }
-      } catch (e) {
-        console.error('failed to parse metrics message', e);
-      }
-    });
-  } catch (err) {
-    console.error('redis subscribe error', err);
-  }
-})();
+// Redis subscriptions moved to server/lib/redisSubscriptions.js
+try {
+  require('./lib/redisSubscriptions');
+} catch (e) {
+  console.warn('redis subscriptions module failed to load', e);
+}
