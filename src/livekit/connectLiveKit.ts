// src/livekit/connectLiveKit.ts
import { Room } from 'livekit-client';

export async function connectLiveKit(url: string, token: string): Promise<Room> {
    const room = new Room({
        adaptiveStream: true,
        dynacast: true,
    });
    await room.connect(url, token);
    return room;
}
