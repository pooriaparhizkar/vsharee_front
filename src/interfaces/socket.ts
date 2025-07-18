export interface __SocketUserType {
    id: string;
    name: string;
}

export interface __SocketMessageType {
    message: string;
    user: __SocketUserType;
}
export interface __ServerToClientEvents {
    connect: () => void;
    joinedGroup: (data: { onlineMembers: __SocketUserType[] }) => void;
    userJoined: (data: __SocketUserType) => void;
    newMessage: (data: __SocketMessageType) => void;
    messageSent: (data: any) => void;
    syncVideo: (data: any) => void;
    error: (err: any) => void;
    userLeft: (data: __SocketUserType) => void;
    heartbeat_ack: (data: any) => void;
    videoStream: (data: { videoData: string; user: __SocketUserType }) => void;
    videoOffer: (data: { offer: RTCSessionDescriptionInit }) => void;
    videoAnswer: (data: { answer: RTCSessionDescriptionInit }) => void;
    iceCandidate: (data: { candidate: RTCIceCandidateInit }) => void;
}

export interface __ClientToServerEvents {
    joinGroup: (data: { groupId: string }) => void;
    sendMessage: (data: { groupId: string; message: string }) => void;
    videoControl: (data: { groupId: string; action: any }) => void;
    leftGroup: (data: any) => void;
    heartbeat: () => void;
    videoSelected: (data: { groupId: string; videoData: string; user: __SocketUserType }) => void;
    videoOffer: (data: { offer: RTCSessionDescriptionInit; groupId: string }) => void;
    videoAnswer: (data: { answer: RTCSessionDescriptionInit; groupId: string }) => void;
    iceCandidate: (data: { candidate: RTCIceCandidateInit; groupId: string }) => void;
}
