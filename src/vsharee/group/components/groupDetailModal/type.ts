import { GroupType, SocketUserType } from 'interfaces';

export interface GroupDetailModalProps {
    onClose: () => void;
    isOpen: boolean;
    groupData?: GroupType | null;
    onlineMembers?: SocketUserType[];
}
