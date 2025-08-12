import { MdDelete, MdEdit, MdGroupAdd, MdRestartAlt } from 'react-icons/md';
import { EditGroupOptions } from './type';

export const editGroupButtonOptionsData = [
    {
        label: 'Edit Group',
        key: EditGroupOptions.edit,
        icon: MdEdit,
    },
    {
        label: 'Manage Members',
        key: EditGroupOptions.addMember,
        icon: MdGroupAdd,
    },
    { label: 'Delete Group', key: EditGroupOptions.delete, icon: MdDelete },
    { label: 'Restart Content', key: EditGroupOptions.restart, icon: MdRestartAlt },
];
