// src/vsharee/group/sections/player/methods/stream/index.tsx
import { useEffect, useRef, useState, useContext } from 'react';
import { useLiveKit } from '@/livekit/useLiveKit';
import { RoomEvent, RemoteTrack, RemoteTrackPublication } from 'livekit-client';
import { StreamVideoPlayerProps } from './type';
import { GroupRoleEnum } from '@/interfaces';
import HostControls from './hostControl';
import { SocketContext } from '@/context/SocketContext';
import { VideoControlEnum } from '@/interfaces';
import { srtToVttBrowser } from '@/scripts';

function isMobileSafariUA() {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    const iOS = /iPad|iPhone|iPod/.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    return iOS && isSafari;
}

const StreamVideoPlayer: React.FC<StreamVideoPlayerProps> = (props: StreamVideoPlayerProps) => {
    const { room } = useLiveKit();
    const socket = useContext(SocketContext);
    const viewerRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [needTapToPlay, setNeedTapToPlay] = useState(false);
    const [myRole, setMyRole] = useState<GroupRoleEnum>();
    const canControl = myRole && [GroupRoleEnum.CONTROLLER, GroupRoleEnum.CREATOR].includes(myRole);
    const [isPublishing, setIsPublishing] = useState(false);
    const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
    const subtitleInputRef = useRef<HTMLInputElement | null>(null);
    const [subtitleUrl, setSubtitleUrl] = useState<string>('');

    useEffect(() => {
        if (props.myRole) setMyRole(props.myRole);
    }, [props.myRole]);

    const [hasViewerSource, setHasViewerSource] = useState(false);
    const [isViewerPlaying, setIsViewerPlaying] = useState(false);

    useEffect(() => {
        const v = viewerRef.current;
        if (!v) return;

        const computeHasSource = () => {
            const hasSrc = Boolean(v.src && v.src.trim() !== '');
            const hasObj = !!(
                v.srcObject &&
                (v.srcObject as MediaStream).getTracks &&
                (v.srcObject as MediaStream).getTracks().length > 0
            );
            setHasViewerSource(hasSrc || hasObj);
        };

        const onLoaded = () => {
            computeHasSource();
        };
        const onEmptied = () => {
            computeHasSource();
        };
        const onPlay = () => {
            setIsViewerPlaying(true);
            computeHasSource();
        };
        const onPause = () => {
            setIsViewerPlaying(false);
        };
        const onEnded = () => {
            setIsViewerPlaying(false);
        };

        // initialize once
        computeHasSource();
        if (!v.paused && !v.ended) setIsViewerPlaying(true);

        v.addEventListener('loadedmetadata', onLoaded);
        v.addEventListener('emptied', onEmptied);
        v.addEventListener('play', onPlay);
        v.addEventListener('pause', onPause);
        v.addEventListener('ended', onEnded);

        return () => {
            v.removeEventListener('loadedmetadata', onLoaded);
            v.removeEventListener('emptied', onEmptied);
            v.removeEventListener('play', onPlay);
            v.removeEventListener('pause', onPause);
            v.removeEventListener('ended', onEnded);
        };
    }, [viewerRef]);

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
                    setIsViewerPlaying(true);
                } catch {
                    // autoplay might be blocked; state will update on user gesture
                    setIsViewerPlaying(false);
                }
                setHasRemoteVideo(true);
                setHasViewerSource(true);
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
            if (viewerRef.current) {
                try {
                    viewerRef.current.pause();
                } catch {}
                (viewerRef.current as HTMLVideoElement).src = '';
                viewerRef.current.srcObject = null;
            }
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.srcObject = null;
            }
            setNeedTapToPlay(false);
            setHasRemoteVideo(false);
            setHasViewerSource(false);
            setIsViewerPlaying(false);
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

    const handleSubtitleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];

        if (file.name.toLowerCase().endsWith('.srt')) {
            const srtText = await file.text();
            const vttText = srtToVttBrowser(srtText);
            const vttBlob = new Blob([vttText], { type: 'text/vtt' });
            const vttUrl = URL.createObjectURL(vttBlob);
            setSubtitleUrl(vttUrl);
        } else {
            const url = URL.createObjectURL(file);
            setSubtitleUrl(url);
        }
    };

    // Listen to host sync events to reflect state on the viewer UI and to kick autoplay if needed
    useEffect(() => {
        if (!socket) return;
        const handler = (data: { user: any; action: VideoControlEnum; time: number }) => {
            // NOTE: Viewers cannot seek a remote WebRTC stream. The timeline is controlled
            // by the publisher (HostControls). We only update UI and try to resume playback
            // if autoplay was blocked previously.
            if (data.action === VideoControlEnum.PLAY) {
                // try resume audio if Safari/iOS blocked it earlier
                if (audioRef.current) {
                    audioRef.current.play().catch(() => {
                        /* ignore; button will remain if needed */
                    });
                }
                if (viewerRef.current) {
                    viewerRef.current.play?.().catch(() => {
                        /* ignore */
                    });
                }
            }
        };
        socket.on('syncVideo', handler);
        return () => {
            socket.off('syncVideo', handler);
        };
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
        <div
            className={`flex w-full flex-1 flex-col items-center justify-center p-4 ${hasViewerSource ? 'bg-black !p-0' : ''}`}
        >
            {canControl && room && (
                <HostControls
                    hasViewerSource={hasViewerSource}
                    room={room}
                    previewRef={viewerRef}
                    onPublishingChange={setIsPublishing}
                />
            )}

            {!canControl && !hasRemoteVideo && (
                <div>
                    <h1 className="text-md text-gray99 font-medium">
                        Wait for qualified people to start the stream...
                    </h1>
                </div>
            )}

            {needTapToPlay && (
                <button onClick={enableAudio} className="rounded bg-yellow-500 px-3 py-2 text-black">
                    Tap to enable sound
                </button>
            )}

            <div className={`relative h-full w-full ${!hasViewerSource ? 'hidden' : ''}`}>
                <video
                    ref={viewerRef}
                    className="absolute inset-0 h-full w-full object-contain"
                    controls
                    autoPlay
                    playsInline
                >
                    {subtitleUrl && <track src={subtitleUrl} kind="subtitles" srcLang="en" default />}
                </video>
                <div className="absolute top-3 right-3 flex items-center gap-4">
                    <button
                        onClick={() => subtitleInputRef.current?.click()}
                        className="cursor-pointer rounded bg-black/60 px-2 py-1 text-white transition-opacity hover:opacity-70"
                    >
                        CC
                    </button>
                    <button
                        onClick={() => subtitleInputRef.current?.click()}
                        className="cursor-pointer rounded bg-black/60 px-2 py-1 text-white transition-opacity hover:opacity-70"
                    >
                        Stop
                    </button>
                </div>
                <input
                    type="file"
                    accept=".vtt,.srt"
                    ref={subtitleInputRef}
                    onChange={handleSubtitleSelect}
                    className="hidden"
                />
            </div>

            <audio ref={audioRef} className="hidden" />
        </div>
    );
};
export default StreamVideoPlayer;
