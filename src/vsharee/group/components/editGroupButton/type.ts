import { GroupType } from 'interfaces';

export interface EditGroupButtonProps {
    groupData?: GroupType | null;
    reFetch: () => void;
    onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

export enum EditGroupOptions {
    edit,
    addMember,
    delete,
    restart,
}
