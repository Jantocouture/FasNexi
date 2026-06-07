// add post comments subscription handling to existing Redis subscriber in server/index.js
// This file replaces the earlier Redis subscribe block to include 'post:comments' channel.

(async () => {
  try {
    const sub = connection.duplicate();
    await sub.connect();
    // subscribe to feed updates
    await sub.subscribe('feed:updates', (message) => {
      try {
        const data = JSON.parse(message);
        const room = `profile:${data.profileId}`;
        io.to(room).emit('feedUpdate', data);
        console.log('emitted feedUpdate for', data.profileId);
      } catch (e) {
        console.error('failed to parse feed update', e);
        if (Sentry.captureException) Sentry.captureException(e);
      }
    });
    // subscribe to post comments
    await sub.subscribe('post:comments', (message) => {
      try {
        const data = JSON.parse(message);
        const room = `post:${data.postId}`;
        io.to(room).emit('comment', data.comment);
        console.log('emitted comment for post', data.postId);
      } catch (e) {
        console.error('failed to parse post comment', e);
        if (Sentry.captureException) Sentry.captureException(e);
      }
    });
    // subscribe to metrics channel if present
    await sub.subscribe('metrics', (message) => {
      try {
        const data = JSON.parse(message);
        if (data && data.event === 'dlq') {
          dlqEntries.inc();
          console.log('metric: dlq entry for', data.queue);
        }
      } catch (e) {
        console.error('failed to parse metrics message', e);
      }
    });
  } catch (err) {
    console.error('redis subscribe error', err);
  }
})();
