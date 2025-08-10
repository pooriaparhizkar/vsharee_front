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

    useEffect(() => {
        socket?.on('receiveVideoFileHash', ({ hash, name }) => {
            setRemoteHash(hash);
            setFileName(name);
            setHasRemoteSelected(true);
            setCanSelectVideo(false);
            if (canControl) return;
        });
        socket?.on('syncVideo', (data) => {
            if (!videoRef.current) return;
            isRemoteAction.current = true;
            const { action, time } = data;
            if (typeof time !== 'number') return;
            switch (action) {
                case 'PLAY':
                    videoRef.current.currentTime = time;
                    videoRef.current.play();
                    break;
                case 'PAUSE':
                    videoRef.current.currentTime = time;
                    videoRef.current.pause();
                    break;
                case 'MOVE':
                    videoRef.current.currentTime = time;
                    break;
            }
            setTimeout(() => {
                isRemoteAction.current = false;
            }, 100);
        });

        return () => {
            socket?.off('receiveVideoFileHash');
            socket?.off('syncVideo');
        };
    }, [socket, canControl]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];
        const hash = await hashFile(file);
        console.log('Selected file hash:', hash);
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
        console.log('Selected file hash:', hash);
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

    const handlePlay = () => {
        if (id && canControl && videoRef.current && !isRemoteAction.current) {
            socket?.emit('videoControl', {
                groupId: id,
                action: VideoControlEnum.PLAY,
                time: videoRef.current.currentTime,
            });
        }
    };

    const handlePause = () => {
        if (id && canControl && videoRef.current && !isRemoteAction.current) {
            socket?.emit('videoControl', {
                groupId: id,
                action: VideoControlEnum.PAUSE,
                time: videoRef.current.currentTime,
            });
        }
    };

    const handleSeeked = () => {
        if (id && canControl && videoRef.current && !isRemoteAction.current) {
            videoRef.current.pause();
            socket?.emit('videoControl', {
                groupId: id,
                action: VideoControlEnum.MOVE,
                time: videoRef.current.currentTime,
            });
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
