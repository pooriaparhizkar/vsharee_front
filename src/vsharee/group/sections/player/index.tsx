import { Card } from '@/utilities/components';
import { SocketContext } from '@/context/SocketContext';
import { useContext, useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { userDataAtom } from '@/atom';
import Button from '@mui/material/Button';

const GroupVideoPlayer: React.FC = () => {
    const socket = useContext(SocketContext);
    const { id } = useParams();
    const [videoURL, setVideoURL] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    useEffect(() => {
        socket.on('videoOffer', async ({ offer }) => {
            console.log('Received videoOffer');
            peerConnection.current = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

            peerConnection.current.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('iceCandidate', {
                        candidate: event.candidate,
                        groupId: id!,
                    });
                }
            };

            const remoteStream = new MediaStream();
            let hasSetRemote = false;

            peerConnection.current.ontrack = (event) => {
                console.log('ontrack fired:', event.track.kind, event.track);
                remoteStream.addTrack(event.track);

                if (!hasSetRemote && remoteVideoRef.current) {
                    const videoEl = remoteVideoRef.current;
                    videoEl.srcObject = remoteStream;
                    hasSetRemote = true;
                    console.log('Set remoteVideoRef srcObject');

                    videoEl.onloadedmetadata = () => {
                        console.log('Remote video metadata loaded');
                        videoEl
                            .play()
                            .then(() => {
                                console.log('Remote video playback started');
                                console.log('Remote video dimensions:', videoEl.videoWidth, videoEl.videoHeight);
                            })
                            .catch((err) => {
                                console.error('play() failed after metadata:', err);
                            });
                    };
                }
            };

            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
            console.log('Remote description set. Receivers:', peerConnection.current.getReceivers());
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            socket.emit('videoAnswer', {
                answer,
                groupId: id!,
            });
        });

        socket.on('videoAnswer', async ({ answer }) => {
            console.log('Received videoAnswer');
            if (peerConnection.current?.signalingState === 'have-local-offer') {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
            } else {
                console.warn(
                    'Ignoring videoAnswer: unexpected signaling state',
                    peerConnection.current?.signalingState,
                );
            }
        });

        socket.on('iceCandidate', async ({ candidate }) => {
            console.log('Received iceCandidate');
            await peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
        });

        return () => {
            socket.off('videoOffer');
            socket.off('videoAnswer');
            socket.off('iceCandidate');
        };
    }, []);

    const startWebRTC = async (stream: MediaStream) => {
        console.log('Starting WebRTC setup with stream:', stream);
        peerConnection.current = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

        peerConnection.current.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('Emitting ICE candidate');
                socket.emit('iceCandidate', {
                    candidate: event.candidate,
                    groupId: id!,
                });
            }
        };

        stream.getTracks().forEach((track) => {
            console.log('Adding track to peerConnection:', track);
            peerConnection.current?.addTrack(track, stream);
        });

        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        console.log('Emitting videoOffer with SDP');
        socket.emit('videoOffer', {
            offer,
            groupId: id!,
        });
    };

    const handleVideoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setVideoURL(url);

            setTimeout(() => {
                if (localVideoRef.current) {
                    const videoEl = localVideoRef.current as HTMLVideoElement & {
                        captureStream: () => MediaStream;
                    };
                    const stream = videoEl.captureStream();
                    console.log('Captured stream tracks:', stream.getTracks());
                    startWebRTC(stream);
                } else {
                    console.warn('localVideoRef.current not found');
                }
            }, 500);
        }
    };

    return (
        <Card className={`flex-1 overflow-hidden ${videoURL ? '!bg-black !p-0' : ''}`}>
            <div className="flex flex-1 items-center justify-center">
                {videoURL ? (
                    <div className="w-full py-4">
                        <div className="relative h-0 w-full overflow-hidden pb-[56.25%]">
                            <video
                                ref={localVideoRef}
                                src={videoURL}
                                autoPlay
                                controls
                                className="absolute top-0 left-0 h-full w-full"
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <input
                            type="file"
                            accept="video/*"
                            onChange={handleVideoSelect}
                            ref={fileInputRef}
                            className="hidden"
                        />
                        <Button variant="contained" onClick={triggerFileSelect}>
                            Select Video
                        </Button>
                        <div className="relative mt-4 h-0 w-full overflow-hidden pb-[56.25%]">
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                muted
                                controls
                                className="absolute top-0 left-0 h-full w-full"
                            />
                        </div>
                    </>
                )}
            </div>
        </Card>
    );
};

export default GroupVideoPlayer;
