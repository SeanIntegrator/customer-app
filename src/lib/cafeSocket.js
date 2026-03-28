import { io } from 'socket.io-client';

let socket = null;

/** Single Socket.IO client for café server events (shared across subscribers). */
export function getCafeSocket() {
  if (typeof window === 'undefined') return null;
  if (!socket) {
    const base =
      (import.meta.env.VITE_API_URL && String(import.meta.env.VITE_API_URL).trim()) ||
      (import.meta.env.DEV ? 'http://localhost:3000' : '');
    if (!base) return null;
    socket = io(base, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });
  }
  return socket;
}
