import { VideoPlayingMethodsEnum } from './type';

export const VideoPlayingMethodsData = [
    {
        title: 'Stream video file (upto 2 member)',
        key: VideoPlayingMethodsEnum.STREAM,
    },
    { title: 'Stream from URL', key: VideoPlayingMethodsEnum.URL },
    { title: 'Play from Local', key: VideoPlayingMethodsEnum.LOCAL },
];
