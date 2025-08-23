import { Room, RoomEvent } from 'livekit-client';
import { useEffect, useRef, useState } from 'react';

export default function HostControls({ room }: { room: Room }) {
    const hiddenRef = useRef<HTMLVideoElement>(null);
    const previewRef = useRef<HTMLVideoElement>(null);
    const [publishing, setPublishing] = useState(false);
    const [pubTrackSids, setPubTrackSids] = useState<string[]>([]);
    const audioCtxRef = useRef<AudioContext | null>(null);

    // Create/return a shared AudioContext (some browsers require user gesture already occurred)
    function getAudioContext() {
        if (!audioCtxRef.current) {
            try { audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch { }
        }
        return audioCtxRef.current;
    }

    // Build an audio track from a <video> element via WebAudio (for Safari/iOS when captureStream has no audio)
    function audioTrackFromVideoElement(el: HTMLMediaElement): MediaStreamTrack | undefined {
        const ctx = getAudioContext();
        if (!ctx) return undefined;
        const src = ctx.createMediaElementSource(el);
        const dest = ctx.createMediaStreamDestination();
        try { src.connect(dest); src.connect(ctx.destination); } catch { }
        return dest.stream.getAudioTracks()[0];
    }

    async function getMicTrack(): Promise<MediaStreamTrack | undefined> {
        try {
            const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
            return mic.getAudioTracks()[0];
        } catch { return undefined; }
    }

    // Publish given tracks and wire bookkeeping/preview
    async function publishTracks(stream: MediaStream) {
        // Show local preview (muted to avoid echo)
        if (previewRef.current) {
            previewRef.current.srcObject = stream;
            previewRef.current.muted = true;
            previewRef.current.playsInline = true;
            previewRef.current.play().catch(() => { });
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
            if (pubTrackSids.includes(pub.trackSid)) {
                room.localParticipant.unpublishTrack(pub.track!);
                pub.track?.stop();
            }
        });
        setPubTrackSids([]);
        setPublishing(false);

        const v = hiddenRef.current!;
        if (v) {
            v.pause();
            v.src = '';
            v.onended = null;
        }
        if (previewRef.current) {
            previewRef.current.srcObject = null;
        }
        if (audioCtxRef.current) {
            audioCtxRef.current.close().catch(() => { });
            audioCtxRef.current = null;
        }
    }

    // Optional: if you want “Change video” to replace the current stream
    async function replaceIfPublishing() {
        if (publishing) await stop();
    }

    // --- Publish from local file via captureStream() ---
    async function publishFromFile(file: File) {
        await replaceIfPublishing();

        const v = hiddenRef.current!;
        v.src = URL.createObjectURL(file);
        v.muted = true; v.playsInline = true;
        await v.play();

        let stream: MediaStream | undefined = (v as any).captureStream?.();
        if (!stream) { alert('captureStream() not supported. Try Share Screen/Tab.'); return; }

        // Ensure we have audio: if captureStream has no audio, synthesize from video element (Safari)
        if (stream.getAudioTracks().length === 0) {
            const aTrack = audioTrackFromVideoElement(v);
            if (aTrack) {
                const composed = new MediaStream([...stream.getVideoTracks()]);
                composed.addTrack(aTrack);
                stream = composed;
            }
        }

        setPublishing(true);
        await publishTracks(stream);

        // Also stop when the <video> element finishes playback
        v.onended = () => stop();
    }

    // --- Screen/tab share fallback (desktop, includes system audio) ---
    async function shareScreen() {
        await replaceIfPublishing();

        // Request display capture with audio; various browsers behave differently
        let display: MediaStream;
        try {
            display = await (navigator.mediaDevices as any).getDisplayMedia({
                video: { frameRate: 30 },
                audio: { echoCancellation: false, noiseSuppression: false }
            });
        } catch (e) { return; }

        let stream = new MediaStream([...display.getVideoTracks()]);

        // Prefer display audio if provided; otherwise fall back to microphone
        let aTrack: MediaStreamTrack | undefined = display.getAudioTracks()[0];
        if (!aTrack) {
            const mic = await getMicTrack();
            if (mic) aTrack = mic;
        }
        if (aTrack) stream.addTrack(aTrack);

        setPublishing(true);
        await publishTracks(stream);
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

    return (
        <div className="flex gap-2 items-center">
            <label className="inline-block">
                <span className="px-3 py-2 rounded bg-blue-600 text-white cursor-pointer">
                    {publishing ? 'Change video' : 'Select video'}
                </span>
                <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => e.target.files && publishFromFile(e.target.files[0])}
                />
            </label>

            <button onClick={shareScreen} className="px-3 py-2 rounded bg-slate-700 text-white">
                Share screen/tab
            </button>

            {publishing && (
                <button onClick={stop} className="px-3 py-2 rounded bg-rose-600 text-white">
                    Stop
                </button>
            )}

            {/* Hidden player feeding captureStream() */}
            <video ref={hiddenRef} className="hidden" />
            {/* Local preview for the publisher */}
            <video
                ref={previewRef}
                className="w-48 h-28 rounded bg-black"
                autoPlay
                playsInline
                muted
            />
        </div>
    );
}