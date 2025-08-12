import { __SocketUserType } from './socket';

export interface __GroupMembersType {
    role: __GroupRoleEnum;
    user?: __UserType;
}

export interface __GroupType {
    createdAt: string;
    id: string;
    name: string;
    description?: string;
    members: __GroupMembersType[];
    isIdle: boolean;
}
export interface __UserType {
    id: string;
    email: string;
    name: string;
    createdAt: string;
    groups: __GroupType[];
}

export interface __loginType {
    token: string;
    user: __UserType;
}

export interface __MessageType {
    id: string;
    text: string;
    sender: __SocketUserType;
    createdAt: string;
}

export enum __GroupRoleEnum {
    CREATOR = 'CREATOR',
    CONTROLLER = 'CONTROLLER',
    MEMBER = 'MEMBER',
}

export enum __VideoControlEnum {
    PLAY = 'PLAY',
    PAUSE = 'PAUSE',
    MOVE = 'MOVE',
}
