import { SocketContext } from '@/context/SocketContext';
import { useContext, useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { GroupRoleEnum, VideoControlEnum } from '@/interfaces';
import { LocalVideoPlayerProps } from './type';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

const LocalVideoPlayer: React.FC<LocalVideoPlayerProps> = (props: LocalVideoPlayerProps) => {
    const [myRole, setMyRole] = useState<GroupRoleEnum>();
    const socket = useContext(SocketContext);
    const { id } = useParams();
    const videoRef = useRef<HTMLVideoElement>(null);
    const isRemoteAction = useRef(false);
    const emitTimeout = useRef<NodeJS.Timeout | null>(null);
    const justPaused = useRef(false);

    const [videoHash, setVideoHash] = useState<string>('');
    const [currentUrl, setCurrentUrl] = useState<string>('');
    const [remoteHash, setRemoteHash] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');
    const [hashConfirmed, setHashConfirmed] = useState<boolean>(false);
    const [hasRemoteSelected, setHasRemoteSelected] = useState<boolean>(false);
    const [hashMismatch, setHashMismatch] = useState<boolean>(false);
    const [selectedFileUrl, setSelectedFileUrl] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [isHashing, setIsHashing] = useState(false);
    const [hashProgress, setHashProgress] = useState(0);
    const [canSelectVideo, setCanSelectVideo] = useState<boolean>();
    const canControl = myRole && [GroupRoleEnum.CONTROLLER, GroupRoleEnum.CREATOR].includes(myRole);

    useEffect(() => {
        if (props.myRole) {
            setMyRole(props.myRole);
            setCanSelectVideo(
                !!(props.myRole && [GroupRoleEnum.CONTROLLER, GroupRoleEnum.CREATOR].includes(props.myRole)),
            );
        }
    }, [props.myRole]);

    const hashFile = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadstart = () => {
                setIsHashing(true);
                setHashProgress(0);
            };
            reader.onprogress = (event) => {
                if (event.lengthComputable) {
                    const progress = Math.round((event.loaded / event.total) * 100);
                    setHashProgress(progress);
                }
            };
            reader.onload = async () => {
                if (reader.result && reader.result instanceof ArrayBuffer) {
                    try {
                        const hashBuffer = await window.crypto.subtle.digest('SHA-256', reader.result);
                        const hashArray = Array.from(new Uint8Array(hashBuffer));
                        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
                        setIsHashing(false);
                        resolve(hashHex);
                    } catch (error) {
                        setIsHashing(false);
                        reject('Hashing failed: ' + error);
                    }
                } else {
                    setIsHashing(false);
                    reject('File reading failed or result is not ArrayBuffer');
                }
            };
            reader.onerror = () => {
                setIsHashing(false);
                reject('File reading error');
            };
            reader.readAsArrayBuffer(file);
        });
    };

    // Queue for incoming remote video actions
    type VideoAction = { action: VideoControlEnum; time: number };
    const actionQueue = useRef<VideoAction[]>([]);
    const processingAction = useRef(false);

    const processQueue = async () => {
        if (processingAction.current) return;
        processingAction.current = true;

        while (actionQueue.current.length > 0) {
            const { action, time } = actionQueue.current.shift()!;
            if (!videoRef.current) break;

            isRemoteAction.current = true;

            switch (action) {
                case VideoControlEnum.PLAY:
                    videoRef.current.currentTime = time;
                    try {
                        await videoRef.current.play();
                    } catch (e: any) {
                        if (e.name !== 'AbortError') console.error(e);
                    }
                    break;
                case VideoControlEnum.PAUSE:
                    videoRef.current.currentTime = time;
                    videoRef.current.pause();
                    break;
                case VideoControlEnum.MOVE:
                    videoRef.current.currentTime = time;
                    break;
            }

            // Wait 250ms to let video settle before next action
            await new Promise((resolve) => setTimeout(resolve, 250));

            isRemoteAction.current = false;
        }

        processingAction.current = false;
    };

    useEffect(() => {
        socket?.on('receiveVideoFileHash', ({ hash, name }) => {
            setRemoteHash(hash);
            setFileName(name);
            setHasRemoteSelected(true);
            setCanSelectVideo(false);
            if (canControl) return;
        });

        const handleSyncVideo = (data: { action: string; time: number }) => {
            if (
                data.action === VideoControlEnum.PLAY ||
                data.action === VideoControlEnum.PAUSE ||
                data.action === VideoControlEnum.MOVE
            ) {
                actionQueue.current.push({ action: data.action, time: data.time });
                processQueue();
            }
        };

        socket?.on('syncVideo', handleSyncVideo);

        return () => {
            socket?.off('receiveVideoFileHash');
            socket?.off('syncVideo', handleSyncVideo);
        };
    }, [socket, canControl]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];
        const hash = await hashFile(file);
        setVideoHash(hash);
        setFileName(file.name);
        setCurrentUrl(URL.createObjectURL(file));
        socket?.emit('sendVideoFileHash', { groupId: id, hash, name: file.name });
        setHashConfirmed(true);
    };

    const handleFileSelectNonController = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];
        const hash = await hashFile(file);
        setVideoHash(hash);
        setFileName(file.name);
        setSelectedFileUrl(URL.createObjectURL(file));
        if (remoteHash && hash !== remoteHash) {
            setHashMismatch(true);
            setCurrentUrl('');
        } else {
            setHashConfirmed(true);
            setCurrentUrl(URL.createObjectURL(file));
            setHashMismatch(false);
        }
    };

    const handleSelectAgain = () => {
        fileInputRef.current?.click();
    };

    const handlePlayAnyway = () => {
        setHashConfirmed(true);
        setCurrentUrl(selectedFileUrl);
        setHashMismatch(false);
    };

    const debounceTimeout = 150;
    // Helper to debounce emit videoControl events
    const emitVideoControl = (action: VideoControlEnum, time: number) => {
        if (emitTimeout.current) clearTimeout(emitTimeout.current);
        emitTimeout.current = setTimeout(() => {
            if (id && socket) {
                socket.emit('videoControl', {
                    groupId: id,
                    action,
                    time,
                });
            }
        }, debounceTimeout);
    };

    const handlePlay = () => {
        if (id && canControl && videoRef.current && !isRemoteAction.current) {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    if (error.name !== 'AbortError') {
                        console.error('Error trying to play video:', error);
                    }
                });
            }

            emitVideoControl(VideoControlEnum.PLAY, videoRef.current.currentTime);
        }
    };

    const handlePause = () => {
        if (id && canControl && videoRef.current && !isRemoteAction.current) {
            videoRef.current.pause();

            justPaused.current = true;

            setTimeout(() => {
                justPaused.current = false;
            }, 300);

            emitVideoControl(VideoControlEnum.PAUSE, videoRef.current.currentTime);
        }
    };

    const handleSeeked = () => {
        if (id && canControl && videoRef.current && !isRemoteAction.current) {
            // Prevent sending MOVE right after pause
            if (justPaused.current) {
                return;
            }
            videoRef.current.pause();
            emitVideoControl(VideoControlEnum.MOVE, videoRef.current.currentTime);
        }
    };

    return (
        <div
            className={`flex w-full flex-1 flex-col items-center justify-center p-4 ${currentUrl ? 'bg-black !p-0' : ''}`}
        >
            {isHashing && (
                <div className="flex flex-col items-center gap-2">
                    <CircularProgress />
                    <div className="text-gray99 mt-2">Hashing video... {hashProgress}%</div>
                </div>
            )}
            {!currentUrl
                ? canSelectVideo
                    ? !isHashing && (
                          <div className="flex w-full flex-col items-center justify-center gap-6">
                              <input
                                  type="file"
                                  accept="video/*"
                                  onChange={handleFileSelect}
                                  ref={fileInputRef}
                                  className="hidden"
                              />
                              <Button variant="contained" onClick={() => fileInputRef.current?.click()}>
                                  Select Video
                              </Button>
                          </div>
                      )
                    : !isHashing && (
                          <div>
                              <input
                                  type="file"
                                  accept="video/*"
                                  onChange={handleFileSelectNonController}
                                  ref={fileInputRef}
                                  className="hidden"
                              />
                              {!hasRemoteSelected ? (
                                  <h1 className="text-md text-gray99 mt-4 font-medium">
                                      Waiting for controller to select the remote file...
                                  </h1>
                              ) : !videoHash ? (
                                  <div className="flex w-full flex-col items-center justify-center gap-6">
                                      <div className="text-gray99 mb-2 text-sm">Remote file selected: {fileName}</div>

                                      <Button variant="contained" onClick={() => fileInputRef.current?.click()}>
                                          Select Your Video
                                      </Button>
                                  </div>
                              ) : hashMismatch ? (
                                  <div className="flex flex-col items-center gap-4">
                                      <div className="text-red-500">Your file does not match the remote file.</div>
                                      <div className="flex items-center gap-4">
                                          <Button variant="contained" onClick={handleSelectAgain}>
                                              Select Video Again
                                          </Button>
                                          <Button variant="outlined" onClick={handlePlayAnyway}>
                                              Play Anyway
                                          </Button>
                                      </div>
                                  </div>
                              ) : !hashConfirmed ? (
                                  <div className="text-md text-gray99 font-medium">Matching hash... please wait.</div>
                              ) : null}
                          </div>
                      )
                : null}
            {hashConfirmed && currentUrl && (
                <div className="relative mt-4 w-full overflow-hidden pb-[56.25%]">
                    <video
                        ref={videoRef}
                        src={currentUrl}
                        controls={canControl}
                        playsInline
                        className="absolute top-0 left-0 h-full w-full"
                        onPlay={handlePlay}
                        onPause={handlePause}
                        onSeeked={handleSeeked}
                    />
                </div>
            )}
        </div>
    );
};

export default LocalVideoPlayer;
