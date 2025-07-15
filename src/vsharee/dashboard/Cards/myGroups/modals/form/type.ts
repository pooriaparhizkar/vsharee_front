import { GroupType } from 'interfaces';

export interface FormGroupModalType {
    isOpen: boolean;
    onClose: (needReFetch?: boolean) => void;
    selectedGroup?: GroupType;
}
