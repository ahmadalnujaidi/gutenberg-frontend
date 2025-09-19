import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { StreamingUpdate } from '../types';

export const useSocket = (serverUrl: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [updates, setUpdates] = useState<StreamingUpdate[]>([]);
  const [currentUpdate, setCurrentUpdate] = useState<StreamingUpdate | null>(null);

  useEffect(() => {
    const newSocket = io(serverUrl);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('✅ Socket connected');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('❌ Socket disconnected');
    });

    newSocket.on('analysis_update', (update: StreamingUpdate) => {
      console.log('📨 Received update:', update.type);
      setCurrentUpdate(update);
      setUpdates(prev => [...prev, update]);
    });

    newSocket.on('joined', (data) => {
      console.log('✅ Joined room:', data.sessionId);
    });

    return () => {
      newSocket.close();
    };
  }, [serverUrl]);

  const joinSession = (sessionId: string) => {
    if (socket) {
      socket.emit('join', sessionId);
    }
  };

  const clearUpdates = () => {
    setUpdates([]);
    setCurrentUpdate(null);
  };

  return {
    socket,
    isConnected,
    updates,
    currentUpdate,
    joinSession,
    clearUpdates
  };
};