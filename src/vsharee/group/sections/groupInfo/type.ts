import { GroupType } from 'interfaces';

export interface GroupInfoCardProps {
    fetch: () => void;
    groupData?: GroupType | null;
}
