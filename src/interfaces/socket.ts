export interface __ServerToClientEvents {
    connect: () => void;
    joinedGroup: (data: any) => void;
    userJoined: (data: any) => void;
    newMessage: (data: any) => void;
    messageSent: (data: any) => void;
    syncVideo: (data: any) => void;
    error: (err: any) => void;
    userLeft: (data: any) => void;
    heartbeat_ack: (data: any) => void;
}

export interface __ClientToServerEvents {
    joinGroup: (data: { groupId: string }) => void;
    sendMessage: (data: { groupId: string; message: string }) => void;
    videoControl: (data: { groupId: string; action: any }) => void;
    leftGroup: (data: any) => void;
    heartbeat: () => void;
}
