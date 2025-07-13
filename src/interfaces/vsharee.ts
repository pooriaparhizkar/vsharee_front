export interface __GroupType {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    creatorId: string;
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
