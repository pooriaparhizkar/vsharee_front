import { GroupMembersType } from 'interfaces';

export interface AddMemberInputProps {
    defaultValue?: GroupMembersType;
    onChange: (e: GroupMembersType) => void;
    isLastOne: boolean;
    delete: (e: GroupMembersType) => void;
}
