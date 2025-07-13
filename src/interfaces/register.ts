import { __Enum } from './vsharee';

export interface __Tokens {
    accessToken: string;
}

export enum __AuthStatus {
    valid = 'valid',
    pending = 'pending',
    inValid = 'inValid',
}

export interface __UserData {
    fullName?: string;
    nationalCode?: string;
    dateOfBirth?: string;
    phoneNumber: string;
    landline?: string;
    emailAddress?: string;
    level: {
        id: string;
        title: string;
        description: string;
        uniqueName: __Enum;
    };
    notifications: string[];
    logins?: string;
    twoFactor: {
        isActive: boolean;
        type: __Enum;
    };
}
