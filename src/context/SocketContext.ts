// SocketContext.ts
import { createContext } from 'react';
import { io, Socket } from 'socket.io-client';
import { ServerToClientEvents, ClientToServerEvents } from '@/interfaces';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export const createSocket = (token: string) => {
    socket = io(BACKEND_URL, {
        auth: { token },
    });
    return socket;
};

export const SocketContext = createContext<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
