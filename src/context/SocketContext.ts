import { createContext } from 'react';
import { authToken } from '@/scripts';
import { io, Socket } from 'socket.io-client';
import { ServerToClientEvents, ClientToServerEvents } from '@/interfaces';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(BACKEND_URL, {
    auth: {
        token: authToken.get() || '',
    },
});

export const SocketContext = createContext(socket);
