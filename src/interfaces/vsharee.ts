export interface __GroupType {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    creatorId: string;
    creator: __UserType;
    members: __UserType[];
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
