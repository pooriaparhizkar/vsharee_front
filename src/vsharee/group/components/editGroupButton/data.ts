import { MdDelete, MdEdit, MdGroupAdd, MdRestartAlt } from 'react-icons/md';
import { EditGroupOptions } from './type';
import { GroupRoleEnum } from '@/interfaces';

export const editGroupButtonOptionsData = [
    {
        label: 'Edit Group',
        key: EditGroupOptions.edit,
        icon: MdEdit,
        permission: [GroupRoleEnum.CREATOR],
    },
    {
        label: 'Manage Members',
        key: EditGroupOptions.addMember,
        icon: MdGroupAdd,
        permission: [GroupRoleEnum.CREATOR],
    },
    { label: 'Delete Group', key: EditGroupOptions.delete, icon: MdDelete, permission: [GroupRoleEnum.CREATOR] },
    {
        label: 'Restart Content',
        key: EditGroupOptions.restart,
        icon: MdRestartAlt,
        permission: [GroupRoleEnum.CREATOR, GroupRoleEnum.CONTROLLER],
    },
];
