import { Room, RoomEvent } from 'livekit-client';
import { useEffect, useRef, useState } from 'react';

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

export default function HostControls({ room }: { room: Room }) {
    const hiddenRef = useRef<HTMLVideoElement>(null);
    const previewRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number | null>(null);

    const [publishing, setPublishing] = useState(false);
    const [pubTrackSids, setPubTrackSids] = useState<string[]>([]);
    const audioCtxRef = useRef<AudioContext | null>(null);

    const SUPPORT = {
        getDisplayMedia: hasGetDisplayMedia(),
        videoCaptureStream: hasVideoCaptureStream(),
        canvasCaptureStream: hasCanvasCaptureStream(),
    };

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

    // Publish given tracks and wire bookkeeping/preview
    async function publishTracks(stream: MediaStream) {
        // Show local preview (muted to avoid echo)
        if (previewRef.current) {
            previewRef.current.srcObject = stream;
            previewRef.current.muted = true;
            previewRef.current.playsInline = true;
            try {
                await previewRef.current.play();
            } catch {
                /* ignore */
            }
        }

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
    }

    // --- STOP: unpublish & stop tracks we published ---
    async function stop() {
        room.localParticipant.trackPublications.forEach((pub) => {
            if (pubTrackSids.includes(pub.trackSid) && pub.track) {
                try {
                    room.localParticipant.unpublishTrack(pub.track);
                } catch { }
                try {
                    pub.track.stop();
                } catch { }
            }
        });
        setPubTrackSids([]);
        setPublishing(false);

        const v = hiddenRef.current!;
        if (v) {
            try { v.pause(); } catch { }
            v.src = '';
            v.onended = null;
        }
        if (previewRef.current) {
            (previewRef.current as HTMLVideoElement).srcObject = null;
        }
        if (audioCtxRef.current) {
            try { await audioCtxRef.current.close(); } catch { }
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
            } catch { }
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
        try { await v.play(); } catch { }

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
                    : 'Your browser does not support captureStream/canvas capture. Try a different browser.'
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
        await publishTracks(stream);

        v.onended = () => { stop(); };
    }

    // --- Screen/tab share ---
    async function shareScreen() {
        await replaceIfPublishing();

        if (!SUPPORT.getDisplayMedia) {
            alert(
                isIOS()
                    ? 'Screen sharing requires iOS 17+ (Safari) and is not available on some iPhone models. Try updating iOS or use a desktop.'
                    : 'Screen capture API (getDisplayMedia) is not supported in this browser.'
            );
            return;
        }

        let display: MediaStream;
        try {
            display = await (navigator.mediaDevices as any).getDisplayMedia({
                video: { frameRate: 30 },
                // On Safari/iOS this is ignored; Chrome may include tab/system audio
                audio: { systemAudio: 'include' as any }
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
        await publishTracks(stream);

        const dispV = display.getVideoTracks()[0];
        if (dispV) {
            dispV.addEventListener('ended', () => stop());
        }
    }

    // Cleanup on unmount or room disconnect
    useEffect(() => {
        const handleDisconnected = () => { stop(); };
        room.on(RoomEvent.Disconnected, handleDisconnected);
        return () => {
            room.off(RoomEvent.Disconnected, handleDisconnected);
            stop();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [room]);

    const disabledFileMsg = !SUPPORT.videoCaptureStream && !SUPPORT.canvasCaptureStream && isIOS()
        ? 'Not supported on this iOS Safari. Use Share screen.'
        : !SUPPORT.videoCaptureStream && !SUPPORT.canvasCaptureStream
            ? 'Browser lacks captureStream/canvas.captureStream.'
            : '';

    const fileDisabled = Boolean(disabledFileMsg);
    const screenDisabled = !SUPPORT.getDisplayMedia;

    return (
        <div className="flex gap-2 items-center">
            <label className={`inline-block ${fileDisabled ? 'opacity-50 cursor-not-allowed' : ''}`} title={disabledFileMsg}>
                <span className="px-3 py-2 rounded bg-blue-600 text-white cursor-pointer">
                    {publishing ? 'Change video' : 'Select video'}
                </span>
                <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    disabled={fileDisabled}
                    onChange={(e) => e.target.files && publishFromFile(e.target.files[0])}
                />
            </label>

            <button
                onClick={shareScreen}
                className={`px-3 py-2 rounded text-white ${screenDisabled ? 'bg-slate-500 cursor-not-allowed opacity-60' : 'bg-slate-700'}`}
                disabled={screenDisabled}
                title={screenDisabled ? (isIOS() ? 'Requires iOS 17+ Safari (may be unavailable on some iPhone models).' : 'getDisplayMedia not supported in this browser.') : ''}
            >
                Share screen/tab
            </button>

            {publishing && (
                <button onClick={stop} className="px-3 py-2 rounded bg-rose-600 text-white">
                    Stop
                </button>
            )}

            {/* Hidden player feeding capture/canvas */}
            <video ref={hiddenRef} className="hidden" />
            <canvas ref={canvasRef} className="hidden" />
            {/* Local preview for the publisher */}
            <video controls ref={previewRef} className="w-48 h-28 rounded bg-black" autoPlay playsInline />
        </div>
    );
}