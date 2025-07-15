import { GroupType } from 'interfaces';

export interface EditGroupButtonProps {
    groupData?: GroupType | null;
    reFetch: () => void;
}

export enum EditGroupOptions {
    edit,
    addMember,
    delete,
}
