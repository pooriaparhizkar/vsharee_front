import { SocketContext } from '@/context/SocketContext';
import { useContext, useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { GroupRoleEnum, VideoControlEnum } from '@/interfaces';
import { UrlVideoPlayerProps } from './type';
import { Input } from '@/utilities/components';
import Button from '@mui/material/Button';

const UrlVideoPlayer: React.FC<UrlVideoPlayerProps> = (props: UrlVideoPlayerProps) => {
    const [myRole, setMyRole] = useState<GroupRoleEnum>();
    const [videoUrl, setVideoUrl] = useState<string>('');
    const [currentUrl, setCurrentUrl] = useState<string>('');
    const socket = useContext(SocketContext);
    const { id } = useParams();
    const videoRef = useRef<HTMLVideoElement>(null);
    const isRemoteAction = useRef(false);

    useEffect(() => {
        if (props.myRole) setMyRole(props.myRole);
    }, [props.myRole]);

    useEffect(() => {
        socket?.on('receiveVideoUrl', (data) => {
            setCurrentUrl(data.url);
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
            socket?.off('receiveVideoUrl');
            socket?.off('syncVideo');
        };
    }, []);

    const handleUrlSubmit = () => {
        if (videoUrl) {
            socket?.emit('sendVideoUrl', { groupId: id, url: videoUrl });
            setCurrentUrl(videoUrl);
        }
    };

    const canControl = myRole && [GroupRoleEnum.CONTROLLER, GroupRoleEnum.CREATOR].includes(myRole);

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
            {!currentUrl ? (
                canControl ? (
                    <div className="flex w-full flex-col items-center justify-center gap-6">
                        <Input type="text" label="Enter video URL" value={videoUrl} onChange={(e) => setVideoUrl(e)} />
                        <Button
                            fullWidth
                            className="mx-auto max-w-[200px]"
                            variant="contained"
                            onClick={handleUrlSubmit}
                        >
                            Share
                        </Button>
                    </div>
                ) : (
                    <div>
                        <h1 className="text-md text-gray99 font-medium">
                            Wait for qualified people to select the video URL...
                        </h1>
                    </div>
                )
            ) : (
                <div className="relative mt-4 h-0 w-full overflow-hidden pb-[56.25%]">
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

export default UrlVideoPlayer;
