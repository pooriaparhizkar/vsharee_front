import { SocketContext } from '@/context/SocketContext';
import { useContext, useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import { GroupRoleEnum } from '@/interfaces';
import { useAtomValue } from 'jotai';
import { userDataAtom } from '@/atom';
import { StreamVideoPlayerProps } from './type';
import { srtToVttBrowser } from '@/scripts';

const StreamVideoPlayer: React.FC<StreamVideoPlayerProps> = (props: StreamVideoPlayerProps) => {
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
    const subtitleInputRef = useRef<HTMLInputElement | null>(null);
    const [subtitleUrl, setSubtitleUrl] = useState<string>('');

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

    return (
        <div
            className={`flex flex-1 items-center justify-center ${isLocalPlaying || isRemotePlaying ? '!bg-black !p-0' : ''}`}
        >
            {videoURL ? (
                <div style={{ display: isLocalPlaying ? 'block' : 'none' }} className="h-full w-full py-4">
                    <div className="relative h-full w-full">
                        <video
                            ref={localVideoRef}
                            src={videoURL}
                            autoPlay
                            controls
                            className="absolute inset-0 h-full w-full object-contain"
                        >
                            {subtitleUrl && <track src={subtitleUrl} kind="subtitles" srcLang="en" default />}
                        </video>
                        <button
                            onClick={() => subtitleInputRef.current?.click()}
                            className="absolute top-3 right-3 cursor-pointer rounded bg-black/60 px-2 py-1 text-white transition-opacity hover:opacity-70"
                        >
                            CC
                        </button>
                        <input
                            type="file"
                            accept=".vtt,.srt"
                            ref={subtitleInputRef}
                            onChange={handleSubtitleSelect}
                            className="hidden"
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
                    <div style={{ display: isRemotePlaying ? 'block' : 'none' }} className="relative h-full w-full">
                        <video
                            controls={myRole && [GroupRoleEnum.CONTROLLER, GroupRoleEnum.CREATOR].includes(myRole)}
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="absolute inset-0 h-full w-full object-contain"
                        >
                            {subtitleUrl && <track src={subtitleUrl} kind="subtitles" srcLang="en" default />}
                            <button
                                onClick={() => subtitleInputRef.current?.click()}
                                className="absolute top-3 right-3 cursor-pointer rounded bg-black/60 px-2 py-1 text-white transition-opacity hover:opacity-70"
                            >
                                CC
                            </button>
                            <input
                                type="file"
                                accept=".vtt,.srt"
                                ref={subtitleInputRef}
                                onChange={handleSubtitleSelect}
                                className="hidden"
                            />
                        </video>
                    </div>
                </>
            )}
        </div>
    );
};

export default StreamVideoPlayer;
