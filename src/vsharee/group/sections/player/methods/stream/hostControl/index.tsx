import { Room, RoomEvent } from 'livekit-client';
import { useEffect, useRef, useState, useContext } from 'react';
import { SocketContext } from '@/context/SocketContext';
import { useParams } from 'react-router-dom';
import { VideoControlEnum } from '@/interfaces';
import Button from '@mui/material/Button';

function isIOS() {
    if (typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function hasGetDisplayMedia() {
    return typeof (navigator.mediaDevices as any)?.getDisplayMedia === 'function';
}

function hasVideoCaptureStream() {
    return typeof (HTMLVideoElement.prototype as any).captureStream === 'function';
}

function hasCanvasCaptureStream() {
    return typeof HTMLCanvasElement.prototype.captureStream === 'function';
}

export default function HostControls({
    room,
    previewRef,
    onPublishingChange,
    hasViewerSource,
}: {
    room: Room;
    previewRef: React.RefObject<HTMLVideoElement>;
    onPublishingChange?: (p: boolean) => void;
    hasViewerSource: boolean;
}) {
    const socket = useContext(SocketContext);
    const { id: groupId } = useParams();

    const hiddenRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number | null>(null);

    const [publishing, setPublishing] = useState(false);
    const [pubTrackSids, setPubTrackSids] = useState<string[]>([]);
    const audioCtxRef = useRef<AudioContext | null>(null);

    // Wire preview element controls (play/pause/seek) to drive the hidden source video
    function bindPreviewControls() {
        const prev = previewRef.current;
        const src = hiddenRef.current;
        if (!prev) return;

        const onPlay = () => {
            // if we have a source element (file publishing), keep it in lockstep
            if (src && src.paused) {
                try {
                    src.play();
                } catch {}
            }
            emitSync(VideoControlEnum.PLAY, src ? src.currentTime || 0 : 0);
        };
        const onPause = () => {
            if (src && !src.paused) {
                try {
                    src.pause();
                } catch {}
            }
            emitSync(VideoControlEnum.PAUSE, src ? src.currentTime || 0 : 0);
        };
        const onSeeking = () => {
            if (src && Number.isFinite(prev.currentTime)) {
                try {
                    src.currentTime = prev.currentTime;
                } catch {}
            }
        };
        const onSeeked = () => {
            const t = src ? src.currentTime || 0 : Number.isFinite(prev.currentTime) ? prev.currentTime : 0;
            emitSync(prev.paused ? VideoControlEnum.PAUSE : VideoControlEnum.PLAY, t);
        };

        prev.addEventListener('play', onPlay);
        prev.addEventListener('pause', onPause);
        prev.addEventListener('seeking', onSeeking);
        prev.addEventListener('seeked', onSeeked);

        return () => {
            prev.removeEventListener('play', onPlay);
            prev.removeEventListener('pause', onPause);
            prev.removeEventListener('seeking', onSeeking);
            prev.removeEventListener('seeked', onSeeked);
        };
    }

    const SUPPORT = {
        getDisplayMedia: hasGetDisplayMedia(),
        videoCaptureStream: hasVideoCaptureStream(),
        canvasCaptureStream: hasCanvasCaptureStream(),
    };

    function emitSync(action: VideoControlEnum, timeSec: number) {
        if (!socket || !groupId) return;
        try {
            socket.emit('videoControl', { groupId, action, time: timeSec });
        } catch {}
    }

    // --- Audio helpers (Safari/iOS friendly) ---
    async function ensureAudioContext(): Promise<AudioContext | null> {
        if (!audioCtxRef.current) {
            try {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            } catch {
                return null;
            }
        }
        const ctx = audioCtxRef.current;
        if (ctx.state !== 'running') {
            try {
                await ctx.resume();
            } catch {
                /* ignore */
            }
        }
        return ctx;
    }

    // Build an audio track from a <video> element via WebAudio (for Safari/iOS when captureStream has no audio)
    async function audioTrackFromVideoElement(el: HTMLVideoElement): Promise<MediaStreamTrack | undefined> {
        const ctx = await ensureAudioContext();
        if (!ctx) return undefined;

        try {
            const src = ctx.createMediaElementSource(el);
            const dest = ctx.createMediaStreamDestination();
            // Do NOT connect to ctx.destination to avoid local echo; publish only the dest stream
            src.connect(dest);
            const track = dest.stream.getAudioTracks()[0];
            if (track) track.enabled = true;
            return track;
        } catch {
            return undefined;
        }
    }

    async function getMicTrack(): Promise<MediaStreamTrack | undefined> {
        try {
            const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
            return mic.getAudioTracks()[0];
        } catch {
            return undefined;
        }
    }

    async function publishTracks(stream: MediaStream, opts?: { previewFrom?: 'stream' | 'file'; fileSrc?: string }) {
        const previewFrom = opts?.previewFrom ?? 'stream';

        if (previewRef.current) {
            const prev = previewRef.current;
            prev.muted = true;
            prev.playsInline = true;
            try {
                if (previewFrom === 'file' && opts?.fileSrc) {
                    (prev as HTMLVideoElement).srcObject = null;
                    prev.src = opts.fileSrc;
                } else {
                    prev.src = '';
                    (prev as HTMLVideoElement).srcObject = stream;
                }
                await prev.play();
            } catch {}
        }

        const unbindPreview = bindPreviewControls();

        const vt = stream.getVideoTracks()[0];
        const at = stream.getAudioTracks()[0];

        if (vt) {
            const videoPub = await room.localParticipant.publishTrack(vt, { simulcast: true });
            setPubTrackSids((s) => [...s, videoPub.trackSid]);
            vt.onended = () => stop();
        }
        if (at) {
            const audioPub = await room.localParticipant.publishTrack(at);
            setPubTrackSids((s) => [...s, audioPub.trackSid]);
            at.onended = () => stop();
        }

        (previewRef.current as any).__unbindPreview = unbindPreview;
    }

    // --- STOP: unpublish & stop tracks we published ---
    async function stop() {
        // let others know playback stopped at current position
        const v = hiddenRef.current!;
        if (v) {
            emitSync(VideoControlEnum.PAUSE, v.currentTime || 0);
        }

        room.localParticipant.trackPublications.forEach((pub) => {
            if (pubTrackSids.includes(pub.trackSid) && pub.track) {
                try {
                    room.localParticipant.unpublishTrack(pub.track);
                } catch {}
                try {
                    pub.track.stop();
                } catch {}
            }
        });
        setPubTrackSids([]);
        setPublishing(false);
        onPublishingChange?.(false);

        // unbind preview control listeners if any
        const prev = previewRef.current as any;
        if (prev && typeof prev.__unbindPreview === 'function') {
            try {
                prev.__unbindPreview();
            } catch {}
            prev.__unbindPreview = undefined;
        }

        if (v) {
            try {
                v.pause();
            } catch {}
            v.src = '';
            v.onended = null;
        }
        if (previewRef.current) {
            const prev = previewRef.current as HTMLVideoElement;
            try {
                prev.pause();
            } catch {}
            // Clear both src and srcObject, then force a reload so 'emptied' fires
            try {
                prev.removeAttribute('src');
            } catch {}
            (prev as any).srcObject = null;
            try {
                prev.load();
            } catch {}
        }
        if (audioCtxRef.current) {
            try {
                await audioCtxRef.current.close();
            } catch {}
            audioCtxRef.current = null;
        }
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    }

    // Optional: if you want “Change video” to replace the current stream
    async function replaceIfPublishing() {
        if (publishing) await stop();
    }

    // --- Canvas fallback for iOS (and browsers without video.captureStream) ---
    function startCanvasPipe(v: HTMLVideoElement): MediaStream | undefined {
        const canvas = canvasRef.current;
        if (!canvas || !SUPPORT.canvasCaptureStream) return undefined;

        canvas.width = v.videoWidth || 1280;
        canvas.height = v.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        if (!ctx) return undefined;

        const draw = () => {
            try {
                ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
            } catch {}
            rafRef.current = requestAnimationFrame(draw);
        };
        draw();

        const stream = canvas.captureStream(30);
        return stream;
    }

    // --- Publish from local file via captureStream() or canvas fallback ---
    async function publishFromFile(file: File) {
        await replaceIfPublishing();

        const v = hiddenRef.current!;
        v.src = URL.createObjectURL(file);
        v.crossOrigin = 'anonymous';
        v.muted = true; // do not play via speakers; audio is routed via WebAudio when needed
        v.playsInline = true;

        await new Promise<void>((resolve) => {
            const ready = () => resolve();
            v.onloadedmetadata = ready;
            v.oncanplay = ready;
        });
        try {
            await v.play();
        } catch {}

        let stream: MediaStream | undefined;

        if (SUPPORT.videoCaptureStream) {
            stream = (v as any).captureStream?.();
        }

        // If no native capture, try canvas fallback
        if (!stream) {
            stream = startCanvasPipe(v);
        }

        if (!stream) {
            alert(
                isIOS()
                    ? 'iOS Safari does not support streaming local files directly. Please use Screen/Tab share or switch to desktop.'
                    : 'Your browser does not support captureStream/canvas capture. Try a different browser.',
            );
            return;
        }

        // Add audio track via WebAudio if needed (common on iOS)
        if (stream.getAudioTracks().length === 0) {
            const aTrack = await audioTrackFromVideoElement(v);
            if (aTrack) {
                const composed = new MediaStream([...stream.getVideoTracks()]);
                composed.addTrack(aTrack);
                stream = composed;
            }
        }

        setPublishing(true);
        onPublishingChange?.(true);
        await publishTracks(stream, { previewFrom: 'file', fileSrc: v.src });

        v.onended = () => {
            emitSync(VideoControlEnum.PAUSE, v.duration || v.currentTime || 0);
            stop();
        };
    }

    // --- Screen/tab share ---
    async function shareScreen() {
        await replaceIfPublishing();

        if (!SUPPORT.getDisplayMedia) {
            alert(
                isIOS()
                    ? 'Screen sharing requires iOS 17+ (Safari) and is not available on some iPhone models. Try updating iOS or use a desktop.'
                    : 'Screen capture API (getDisplayMedia) is not supported in this browser.',
            );
            return;
        }

        let display: MediaStream;
        try {
            display = await (navigator.mediaDevices as any).getDisplayMedia({
                video: { frameRate: 30 },
                // On Safari/iOS this is ignored; Chrome may include tab/system audio
                audio: { systemAudio: 'include' as any },
            });
        } catch {
            return;
        }

        const stream = new MediaStream([...display.getVideoTracks()]);

        // Prefer display audio; otherwise fall back to microphone (iOS/Safari limitation)
        let aTrack: MediaStreamTrack | undefined = display.getAudioTracks()[0];
        if (!aTrack) {
            const mic = await getMicTrack();
            if (mic) aTrack = mic;
        }
        if (aTrack) {
            aTrack.enabled = true;
            stream.addTrack(aTrack);
        }

        setPublishing(true);
        onPublishingChange?.(true);
        await publishTracks(stream);

        const dispV = display.getVideoTracks()[0];
        if (dispV) {
            dispV.addEventListener('ended', () => stop());
        }
    }

    // Cleanup on unmount or room disconnect
    useEffect(() => {
        const handleDisconnected = () => {
            stop();
        };
        room.on(RoomEvent.Disconnected, handleDisconnected);
        return () => {
            room.off(RoomEvent.Disconnected, handleDisconnected);
            stop();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [room]);

    useEffect(() => {
        if (!socket) return;

        const handler = (data: { user: any; action: VideoControlEnum; time: number }) => {
            // Only the current publisher should drive the source element
            if (!publishing) return;
            const v = hiddenRef.current;
            if (!v) return;

            // Seek if we are too far off
            if (Number.isFinite(data.time)) {
                const drift = Math.abs((v.currentTime || 0) - data.time);
                if (drift > 0.35) {
                    try {
                        v.currentTime = data.time;
                    } catch {}
                }
            }

            if (data.action === VideoControlEnum.PLAY) {
                try {
                    v.play();
                } catch {}
            } else if (data.action === VideoControlEnum.PAUSE) {
                try {
                    v.pause();
                } catch {}
            }
        };

        socket.on('syncVideo', handler);
        return () => {
            socket.off('syncVideo', handler);
        };
    }, [socket, publishing]);

    useEffect(() => {
        socket?.on('contentReset', () => {
            stop();
        });
    }, []);

    const disabledFileMsg =
        !SUPPORT.videoCaptureStream && !SUPPORT.canvasCaptureStream && isIOS()
            ? 'Not supported on this iOS Safari. Use Share screen.'
            : !SUPPORT.videoCaptureStream && !SUPPORT.canvasCaptureStream
              ? 'Browser lacks captureStream/canvas.captureStream.'
              : '';

    const fileDisabled = Boolean(disabledFileMsg);
    const screenDisabled = !SUPPORT.getDisplayMedia;

    return (
        <div>
            {!hasViewerSource && (
                <div className="flex h-full w-full items-center justify-center gap-2">
                    <Button
                        variant="contained"
                        className={`inline-block ${fileDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
                        title={disabledFileMsg}
                    >
                        {publishing ? 'Change video' : 'Select video'}

                        <input
                            type="file"
                            accept="video/*"
                            className="hidden"
                            disabled={fileDisabled}
                            onChange={(e) => e.target.files && publishFromFile(e.target.files[0])}
                        />
                    </Button>

                    <Button
                        variant="outlined"
                        onClick={shareScreen}
                        className={`rounded px-3 py-2 text-white ${screenDisabled ? 'cursor-not-allowed bg-slate-500 opacity-60' : 'bg-slate-700'}`}
                        disabled={screenDisabled}
                        title={
                            screenDisabled
                                ? isIOS()
                                    ? 'Requires iOS 17+ Safari (may be unavailable on some iPhone models).'
                                    : 'getDisplayMedia not supported in this browser.'
                                : ''
                        }
                    >
                        Share screen/tab
                    </Button>

                    {publishing && (
                        <button onClick={stop} className="rounded bg-rose-600 px-3 py-2 text-white">
                            Stop
                        </button>
                    )}
                </div>
            )}
            <button onClick={stop}>stop</button>

            {/* Hidden player feeding capture/canvas */}
            <video ref={hiddenRef} className="hidden" />
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
