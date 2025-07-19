import Pusher from 'pusher';

// This check ensures that in a development environment, where the module code might be re-executed,
// we don't end up with multiple Pusher instances.
const globalForPusher = globalThis;

export const pusher = globalForPusher.pusher || new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || 'eu',
  useTLS: true,
});

if (process.env.NODE_ENV !== 'production') {
  globalForPusher.pusher = pusher;
}
