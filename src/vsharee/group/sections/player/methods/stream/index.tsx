// src/vsharee/group/StreamPanel.tsx
import { useEffect, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { useLiveKit } from '@/livekit/useLiveKit';
import { Room, RoomEvent, RemoteTrack, RemoteTrackPublication } from 'livekit-client';
import { livekitAuthAtom } from '@/atom';
import { StreamVideoPlayerProps } from './type';
import { GroupRoleEnum } from '@/interfaces';
import HostControls from './hostControl';

const StreamVideoPlayer: React.FC<StreamVideoPlayerProps> = (props: StreamVideoPlayerProps) => {
    const auth = useAtomValue(livekitAuthAtom);
    const { room } = useLiveKit(); // connects when auth present
    const viewerRef = useRef<HTMLVideoElement>(null);
    const [myRole, setMyRole] = useState<GroupRoleEnum>();
    const canControl = myRole && [GroupRoleEnum.CONTROLLER, GroupRoleEnum.CREATOR].includes(myRole);

    useEffect(() => {
        if (props.myRole) setMyRole(props.myRole);
    }, [props.myRole]);

    // viewer subscription
    useEffect(() => {
        if (!room) return;

        const onSubscribed = (track: RemoteTrack, pub: RemoteTrackPublication) => {
            if (track.kind === 'video' && viewerRef.current) {
                const ms = new MediaStream([track.mediaStreamTrack]);
                viewerRef.current.srcObject = ms;
                viewerRef.current.playsInline = true;
                viewerRef.current.autoplay = true;
                viewerRef.current.play().catch(() => { });
            }
            if (track.kind === 'audio') {
                const audio = new Audio();
                audio.srcObject = new MediaStream([track.mediaStreamTrack]);
                audio.play().catch(() => { });
            }
        };

        const clearVideo = () => {
            if (viewerRef.current) viewerRef.current.srcObject = null;
        };

        room.on(RoomEvent.TrackSubscribed, onSubscribed);
        room.on(RoomEvent.TrackUnsubscribed, clearVideo);
        room.on(RoomEvent.Disconnected, clearVideo);

        return () => {
            room.off(RoomEvent.TrackSubscribed, onSubscribed);
            room.off(RoomEvent.TrackUnsubscribed, clearVideo);
            room.off(RoomEvent.Disconnected, clearVideo);
        };
    }, [room]);

    return (
        <div className="space-y-3">
            {canControl && room && <HostControls room={room} />}

            <div className="rounded-xl overflow-hidden">
                <video ref={viewerRef} controls className="w-full bg-black" />
            </div>
        </div>
    );
}
export default StreamVideoPlayer;