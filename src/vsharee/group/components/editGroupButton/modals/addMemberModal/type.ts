import { GroupType } from 'interfaces';

export interface AddMemberModalProps {
    onClose: (needRefetch?: boolean) => void;
    groupData?: GroupType | null;
}
