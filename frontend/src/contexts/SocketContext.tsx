import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  joinTable: (tableId: string) => void;
  leaveTable: (tableId: string) => void;
  joinKitchen: () => void;
  joinWaiter: () => void;
  joinReception: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const joinTable = (tableId: string) => {
    socketRef.current?.emit('join:table', tableId);
  };

  const leaveTable = (tableId: string) => {
    socketRef.current?.emit('leave:table', tableId);
  };

  const joinKitchen = () => {
    socketRef.current?.emit('join:kitchen');
  };

  const joinWaiter = () => {
    socketRef.current?.emit('join:waiter');
  };

  const joinReception = () => {
    socketRef.current?.emit('join:reception');
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        joinTable,
        leaveTable,
        joinKitchen,
        joinWaiter,
        joinReception,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
