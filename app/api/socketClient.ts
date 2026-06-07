import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';

const API_BASE = process.env.API_BASE || 'http://localhost:4000';

let socket: any = null;

async function createSocket() {
  if (socket && socket.connected) return socket;
  const token = await AsyncStorage.getItem('authToken');
  socket = io(API_BASE, {
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    randomizationFactor: 0.5,
  });
  return socket;
}

export async function subscribeToProfile(profileId: string, cb: (items: any[]) => void) {
  const s = await createSocket();
  const handler = (data: any) => {
    if (data && data.profileId === profileId) cb(data.items || []);
  };
  s.on('feedUpdate', handler);
  s.emit('subscribe', profileId);
  return () => {
    s.off('feedUpdate', handler);
    s.emit('unsubscribe', profileId);
  };
}

export async function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default { createSocket, subscribeToProfile, disconnectSocket };
