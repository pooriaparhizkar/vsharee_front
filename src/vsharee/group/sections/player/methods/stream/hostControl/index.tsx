import { Room, RoomEvent } from 'livekit-client';
import { useEffect, useRef, useState } from 'react';

export default function HostControls({ room }: { room: Room }) {
    const hiddenRef = useRef<HTMLVideoElement>(null);
    const previewRef = useRef<HTMLVideoElement>(null);
    const [publishing, setPublishing] = useState(false);
    const [pubTrackSids, setPubTrackSids] = useState<string[]>([]);
    const audioCtxRef = useRef<AudioContext | null>(null);

    // --- Audio helpers (Safari/iOS friendly) ---

    // Create/return an AudioContext and ensure it's resumed (must be called after a user gesture)
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
                } catch {
                    /* ignore */
                }
                try {
                    pub.track.stop();
                } catch {
                    /* ignore */
                }
            }
        });
        setPubTrackSids([]);
        setPublishing(false);

        const v = hiddenRef.current!;
        if (v) {
            try {
                v.pause();
            } catch { }
            v.src = '';
            v.onended = null;
        }
        if (previewRef.current) {
            (previewRef.current as HTMLVideoElement).srcObject = null;
        }
        if (audioCtxRef.current) {
            try {
                await audioCtxRef.current.close();
            } catch { }
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
        // Prepare element
        v.src = URL.createObjectURL(file);
        v.crossOrigin = 'anonymous';
        v.muted = true; // do not play via speakers; audio is routed via WebAudio when needed
        v.playsInline = true;

        // Safari: wait for metadata before play (and before creating WebAudio node)
        await new Promise<void>((resolve) => {
            const ready = () => resolve();
            v.onloadedmetadata = ready;
            v.oncanplay = ready;
        });
        try {
            await v.play();
        } catch {
            /* ignore */
        }

        // Try native captureStream()
        let stream: MediaStream | undefined = (v as any).captureStream?.();
        if (!stream) {
            alert('Your browser does not support captureStream(). Try “Share screen/tab”.');
            return;
        }

        // If the captured stream has no audio, synthesize via WebAudio (Safari/iOS)
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

        // Stop when the <video> finishes
        v.onended = () => {
            stop();
        };
    }

    // --- Screen/tab share (desktop). iOS/Safari cannot share system audio; fallback to mic. ---
    async function shareScreen() {
        await replaceIfPublishing();

        let display: MediaStream;
        try {
            display = await (navigator.mediaDevices as any).getDisplayMedia({
                video: { frameRate: 30 },
                audio: { systemAudio: 'include' as any } // ignored by Safari; Chrome/Edge may include tab/system audio
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

        // If user stops sharing from browser UI, stop our publication
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
            <video ref={previewRef} className="w-48 h-28 rounded bg-black" autoPlay playsInline muted />
        </div>
    );
}