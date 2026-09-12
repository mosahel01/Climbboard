import { io } from 'socket.io-client';
import { tokenStore } from './api.js';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io({ transports: ['websocket', 'polling'], autoConnect: true });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  const token = tokenStore.get();
  if (token && !s.auth) {
    s.auth = { token };
    s.disconnect();
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Subscribe to a game's real-time leaderboard room.
 * Returns an unsubscribe function.
 */
export function subscribeToLeaderboard(gameId, onUpdate) {
  const s = getSocket();
  s.emit('leaderboard:join', gameId);
  s.on('leaderboard:update', handler);

  function handler(payload) {
    if (payload.gameId === gameId) onUpdate(payload);
  }

  return () => {
    s.off('leaderboard:update', handler);
    s.emit('leaderboard:leave', gameId);
  };
}

export function subscribeToGlobal(onUpdate) {
  const s = getSocket();
  s.on('global:update', onUpdate);
  return () => s.off('global:update', onUpdate);
}

export function subscribeToActivity(onEvent) {
  const s = getSocket();
  s.on('activity:new', onEvent);
  return () => s.off('activity:new', onEvent);
}