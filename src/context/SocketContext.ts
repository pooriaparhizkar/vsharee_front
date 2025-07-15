import { createContext } from 'react';
import { authToken } from '@/scripts';
import { io, Socket } from 'socket.io-client';
import { ServerToClientEvents, ClientToServerEvents } from '@/interfaces';

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('http://localhost:8000', {
    auth: {
        token: authToken.get() || '',
    },
});

export const SocketContext = createContext(socket);
