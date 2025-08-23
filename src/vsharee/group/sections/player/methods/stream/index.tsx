// src/vsharee/group/sections/player/methods/stream/index.tsx
import { useEffect, useRef, useState, useContext } from 'react';
import { useAtomValue } from 'jotai';
import { useLiveKit } from '@/livekit/useLiveKit';
import { Room, RoomEvent, RemoteTrack, RemoteTrackPublication } from 'livekit-client';
import { livekitAuthAtom } from '@/atom';
import { StreamVideoPlayerProps } from './type';
import { GroupRoleEnum } from '@/interfaces';
import HostControls from './hostControl';
import { SocketContext } from '@/context/SocketContext';
import { useParams } from 'react-router-dom';
import { VideoControlEnum } from '@/interfaces';

function isMobileSafariUA() {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    const iOS = /iPad|iPhone|iPod/.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    return iOS && isSafari;
}

const StreamVideoPlayer: React.FC<StreamVideoPlayerProps> = (props: StreamVideoPlayerProps) => {
    const auth = useAtomValue(livekitAuthAtom);
    const { room } = useLiveKit(); // connects when auth present
    const socket = useContext(SocketContext);
    const { id: groupId } = useParams();
    const viewerRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [needTapToPlay, setNeedTapToPlay] = useState(false);
    const [myRole, setMyRole] = useState<GroupRoleEnum>();
    const canControl = myRole && [GroupRoleEnum.CONTROLLER, GroupRoleEnum.CREATOR].includes(myRole);
    const [pausedByHost, setPausedByHost] = useState(false);
    const [pausedAt, setPausedAt] = useState<number | null>(null);

    useEffect(() => {
        if (props.myRole) setMyRole(props.myRole);
    }, [props.myRole]);

    // viewer subscription
    useEffect(() => {
        if (!room) return;

        const onSubscribed = async (track: RemoteTrack, pub: RemoteTrackPublication) => {
            if (track.kind === 'video' && viewerRef.current) {
                const ms = new MediaStream([track.mediaStreamTrack]);
                viewerRef.current.srcObject = ms;
                viewerRef.current.playsInline = true;
                viewerRef.current.autoplay = true;
                try {
                    await viewerRef.current.play();
                } catch {
                    /* ignore */
                }
            }
            if (track.kind === 'audio') {
                if (!audioRef.current) return;
                const s = new MediaStream([track.mediaStreamTrack]);
                audioRef.current.srcObject = s;
                audioRef.current.autoplay = true;
                audioRef.current.muted = false;

                try {
                    await audioRef.current.play();
                    setNeedTapToPlay(false);
                } catch {
                    if (isMobileSafariUA()) {
                        setNeedTapToPlay(true);
                    }
                }
            }
        };

        const clearMedia = () => {
            if (viewerRef.current) viewerRef.current.srcObject = null;
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.srcObject = null;
            }
            setNeedTapToPlay(false);
        };

        room.on(RoomEvent.TrackSubscribed, onSubscribed);
        room.on(RoomEvent.TrackUnsubscribed, clearMedia);
        room.on(RoomEvent.Disconnected, clearMedia);

        return () => {
            room.off(RoomEvent.TrackSubscribed, onSubscribed);
            room.off(RoomEvent.TrackUnsubscribed, clearMedia);
            room.off(RoomEvent.Disconnected, clearMedia);
        };
    }, [room]);

    // Listen to host sync events to reflect state on the viewer UI and to kick autoplay if needed
    useEffect(() => {
        if (!socket) return;
        const handler = (data: { user: any; action: VideoControlEnum; time: number }) => {
            // NOTE: Viewers cannot seek a remote WebRTC stream. The timeline is controlled
            // by the publisher (HostControls). We only update UI and try to resume playback
            // if autoplay was blocked previously.
            if (data.action === VideoControlEnum.PLAY) {
                setPausedByHost(false);
                setPausedAt(null);
                // try resume audio if Safari/iOS blocked it earlier
                if (audioRef.current) {
                    audioRef.current.play().catch(() => {/* ignore; button will remain if needed */ });
                }
                if (viewerRef.current) {
                    viewerRef.current.play?.().catch(() => {/* ignore */ });
                }
            } else if (data.action === VideoControlEnum.PAUSE) {
                setPausedByHost(true);
                setPausedAt(Number.isFinite(data.time) ? data.time : null);
                // We DO NOT pause the element locally; pausing here only affects this viewer.
                // HostControls already paused the source; remote frames will stop advancing.
            }
        };
        socket.on('syncVideo', handler);
        return () => { socket.off('syncVideo', handler); };
    }, [socket]);

    async function enableAudio() {
        if (!audioRef.current) return;
        try {
            await audioRef.current.play();
            setNeedTapToPlay(false);
        } catch (e) {
            // keep the button visible if it still fails
        }
    }

    return (
        <div className="space-y-3">
            {canControl && room && <HostControls room={room} />}

            {needTapToPlay && (
                <button
                    onClick={enableAudio}
                    className="px-3 py-2 rounded bg-yellow-500 text-black"
                >
                    Tap to enable sound
                </button>
            )}

            <div className="relative rounded-xl overflow-hidden">
                <video ref={viewerRef} className="w-full bg-black" />
                {pausedByHost && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <div className="px-3 py-1 rounded bg-white/90 text-black text-sm">
                            Paused by controller{pausedAt !== null ? ` @ ${Math.floor(pausedAt)}s` : ''}
                        </div>
                    </div>
                )}
            </div>

            <audio ref={audioRef} className="hidden" />
        </div>
    );
}
export default StreamVideoPlayer;