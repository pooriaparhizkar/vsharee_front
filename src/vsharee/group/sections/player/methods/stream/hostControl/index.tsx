import { Room, RoomEvent } from 'livekit-client';
import { useEffect, useRef, useState } from 'react';

export default function HostControls({ room }: { room: Room }) {
    const hiddenRef = useRef<HTMLVideoElement>(null);
    const [publishing, setPublishing] = useState(false);
    const [pubTrackSids, setPubTrackSids] = useState<string[]>([]); // store trackSid

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

        const stream: MediaStream | undefined = (v as any).captureStream?.();
        if (!stream) { alert('captureStream() not supported. Try Share Screen/Tab.'); return; }

        setPublishing(true);

        const vt = stream.getVideoTracks()[0];
        const at = stream.getAudioTracks()[0];

        if (vt) {
            const videoPub = await room.localParticipant.publishTrack(vt, { simulcast: true });
            setPubTrackSids((s) => [...s, videoPub.trackSid]); // <- use trackSid
            // auto-stop when the track ends (e.g., file finished)
            vt.onended = () => stop();
        }
        if (at) {
            const audioPub = await room.localParticipant.publishTrack(at);
            setPubTrackSids((s) => [...s, audioPub.trackSid]);
            at.onended = () => stop();
        }

        // Also stop when the <video> element finishes playback
        v.onended = () => stop();
    }

    // --- Screen/tab share fallback (desktop, includes system audio) ---
    async function shareScreen() {
        await replaceIfPublishing();

        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        setPublishing(true);

        const vt = stream.getVideoTracks()[0];
        const at = stream.getAudioTracks()[0];

        if (vt) {
            const videoPub = await room.localParticipant.publishTrack(vt, { simulcast: true });
            setPubTrackSids((s) => [...s, videoPub.trackSid]);
            vt.onended = () => stop(); // when user stops share
        }
        if (at) {
            const audioPub = await room.localParticipant.publishTrack(at);
            setPubTrackSids((s) => [...s, audioPub.trackSid]);
            at.onended = () => stop();
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
        </div>
    );
}