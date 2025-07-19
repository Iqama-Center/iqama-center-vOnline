import jwt from 'jsonwebtoken';
import { pusher } from '../../../lib/pusher';

export default async function handler(req, res) {
  // See https://pusher.com/docs/channels/server_api/authorizing-users/
  const { socket_id, channel_name } = req.body;
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // The channel name should be in the format "private-user-USERID"
    const expectedChannelName = `private-user-${userId}`;

    if (channel_name !== expectedChannelName) {
        return res.status(403).send('Forbidden');
    }

    const authResponse = pusher.authorizeChannel(socket_id, channel_name);
    res.send(authResponse);

  } catch (error) {
    console.error(error);
    res.status(500).send('Error authorizing Pusher channel');
  }
}
