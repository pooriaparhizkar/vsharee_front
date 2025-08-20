// src/livekit/useLiveKit.ts
import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { connectLiveKit } from './connectLiveKit';
import { Room, RoomEvent } from 'livekit-client';
import { livekitAuthAtom, livekitRoomAtom } from '@/atom';

export function useLiveKit() {
    const [auth] = useAtom(livekitAuthAtom);
    const [room, setRoom] = useAtom(livekitRoomAtom);

    useEffect(() => {
        if (!auth.url || !auth.token || room) return;

        let r: Room | null = null;
        (async () => {
            try {
                r = await connectLiveKit(auth.url!, auth.token!);
                // basic cleanup listeners
                r.on(RoomEvent.Disconnected, () => setRoom(null));
                setRoom(r);
            } catch (e) {
                console.error('LiveKit connect failed', e);
            }
        })();

        return () => {
            // do not disconnect here; StreamPanel will unmount-control if needed
        };
    }, [auth.url, auth.token, room]);

    return { room };
}
