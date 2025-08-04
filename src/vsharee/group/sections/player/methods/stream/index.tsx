import { SocketContext } from '@/context/SocketContext';
import { useContext, useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import { GroupRoleEnum } from '@/interfaces';
import { useAtomValue } from 'jotai';
import { userDataAtom } from '@/atom';
import { GroupVideoPlayerProps } from './type';

const StreamVideoPlayer: React.FC<GroupVideoPlayerProps> = (props: GroupVideoPlayerProps) => {
    const [myRole, setMyRole] = useState<GroupRoleEnum>();
    const socket = useContext(SocketContext);
    const { id } = useParams();
    const [videoURL, setVideoURL] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    let pendingRemoteAnswer: RTCSessionDescriptionInit | null = null;
    const remoteDescriptionSet = useRef(false);
    const userData = useAtomValue(userDataAtom);

    // NEW: visibility flags; videos are hidden until they actually start playing
    const [isLocalPlaying, setIsLocalPlaying] = useState(false);
    const [isRemotePlaying, setIsRemotePlaying] = useState(false);

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    useEffect(() => {
        if (props.myRole) setMyRole(props.myRole);
    }, [props.myRole]);

    // NEW: attach 'playing' listeners so visibility flips when playback starts
    useEffect(() => {
        const lv = localVideoRef.current;
        if (!lv) return;

        const onLocalPlaying = () => setIsLocalPlaying(true);
        lv.addEventListener('playing', onLocalPlaying);

        return () => {
            lv.removeEventListener('playing', onLocalPlaying);
        };
    }, [videoURL]);

    useEffect(() => {
        const rv = remoteVideoRef.current;
        if (!rv) return;

        const onRemotePlaying = () => setIsRemotePlaying(true);
        rv.addEventListener('playing', onRemotePlaying);

        return () => {
            rv.removeEventListener('playing', onRemotePlaying);
        };
    }, []);

    useEffect(() => {
        socket?.on('videoOffer', async ({ offer }) => {
            console.log('Received videoOffer');
            peerConnection.current = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

            peerConnection.current.onicecandidate = (event) => {
                if (event.candidate) {
                    socket?.emit('iceCandidate', {
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
                                // visibility for remote will flip on 'playing' event
                            })
                            .catch((err) => {
                                console.error('play() failed after metadata:', err);
                            });
                    };
                }
            };

            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
            remoteDescriptionSet.current = true;
            if (pendingRemoteAnswer) {
                console.log('Applying stored answer after remote offer set');
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(pendingRemoteAnswer));
                pendingRemoteAnswer = null;
            }
            console.log('Remote description set. Receivers:', peerConnection.current.getReceivers());
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            socket?.emit('videoAnswer', {
                answer,
                groupId: id!,
            });
        });

        socket?.on('videoAnswer', async ({ answer }) => {
            console.log('Received videoAnswer');
            if (peerConnection.current?.signalingState === 'have-local-offer') {
                console.log('Setting remote description with answer');
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
            } else if (peerConnection.current?.signalingState === 'stable') {
                console.warn('Already in stable state, ignoring duplicate answer');
            } else {
                console.warn('Signaling not ready. Storing answer for later');
                pendingRemoteAnswer = answer;
            }
        });

        socket?.on('iceCandidate', async ({ candidate }) => {
            console.log('Received iceCandidate');
            await peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
        });

        return () => {
            socket?.off('videoOffer');
            socket?.off('videoAnswer');
            socket?.off('iceCandidate');
        };
    }, []);

    const startWebRTC = async (stream: MediaStream) => {
        console.log('Starting WebRTC setup with stream:', stream);
        peerConnection.current = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

        peerConnection.current.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('Emitting ICE candidate');
                socket?.emit('iceCandidate', {
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

        peerConnection.current.onsignalingstatechange = async () => {
            if (peerConnection.current?.signalingState === 'have-local-offer' && pendingRemoteAnswer) {
                console.log('Applying pending remote answer');
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(pendingRemoteAnswer));
                pendingRemoteAnswer = null;
            }
        };

        setTimeout(async () => {
            if (peerConnection.current?.signalingState === 'have-local-offer' && pendingRemoteAnswer) {
                console.log('Fallback: applying delayed remote answer');
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(pendingRemoteAnswer));
                pendingRemoteAnswer = null;
            }
        }, 500);

        console.log('Emitting videoOffer with SDP');
        socket?.emit('videoOffer', {
            offer,
            groupId: id!,
        });
    };

    const handleVideoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setVideoURL(url);
            setIsLocalPlaying(false); // ensure hidden again for each new selection

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
        <div
            className={`flex flex-1 items-center justify-center ${isLocalPlaying || isRemotePlaying ? '!bg-black !p-0' : ''}`}
        >
            {videoURL ? (
                <div style={{ display: isLocalPlaying ? 'block' : 'none' }} className="w-full py-4">
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
                    {myRole && [GroupRoleEnum.CONTROLLER, GroupRoleEnum.CREATOR].includes(myRole) ? (
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
                        </>
                    ) : (
                        <div style={{ display: isRemotePlaying ? 'none' : 'block' }}>
                            <h1 className="text-md text-gray99 font-medium">
                                Wait for qualified people to select the video...
                            </h1>
                        </div>
                    )}
                    <div
                        style={{ display: isRemotePlaying ? 'block' : 'none' }}
                        className="relative mt-4 h-0 w-full overflow-hidden pb-[56.25%]"
                    >
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="absolute top-0 left-0 h-full w-full"
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default StreamVideoPlayer;
