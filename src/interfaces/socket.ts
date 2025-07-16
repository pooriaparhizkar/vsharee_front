export interface __ServerToClientEvents {
    connect: () => void;
    joinedGroup: (data: { onlineMembers: { id: string; name: string }[] }) => void;
    userJoined: (data: { id: string; name: string }) => void;
    newMessage: (data: any) => void;
    messageSent: (data: any) => void;
    syncVideo: (data: any) => void;
    error: (err: any) => void;
    userLeft: (data: { id: string; name: string }) => void;
    heartbeat_ack: (data: any) => void;
}

export interface __ClientToServerEvents {
    joinGroup: (data: { groupId: string }) => void;
    sendMessage: (data: { groupId: string; message: string }) => void;
    videoControl: (data: { groupId: string; action: any }) => void;
    leftGroup: (data: any) => void;
    heartbeat: () => void;
}
