import { GroupType } from 'interfaces';

export interface GroupDetailModalProps {
    onClose: () => void;
    isOpen: boolean;
    groupData?: GroupType | null;
}
