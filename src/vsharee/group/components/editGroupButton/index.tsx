import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { MdDelete, MdEdit, MdGroupAdd, MdMoreVert } from 'react-icons/md';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { EditGroupButtonProps, EditGroupOptions } from './type';
import { FormGroupModal } from '@/vsharee/components';
import { GroupType } from 'interfaces';
import { useState } from 'react';
import { ConfirmationModal } from '@/utilities/components';
import { del } from '@/scripts';
import { API, PATH } from '@/data';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import AddMemberModal from './modals/addMemberModal';

export default function EditGroupButton(props: EditGroupButtonProps) {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const [editGroupModal, setEditGroupModal] = useState<GroupType>();
    const [deleteGroupModal, setDeleteGroupModal] = useState(false);
    const [addMemberModal, setAddMemberModal] = useState<GroupType>();
    const navigate = useNavigate();
    const options = [
        {
            label: 'Edit Group',
            key: EditGroupOptions.edit,
            icon: MdEdit,
        },
        {
            label: 'Add Member',
            key: EditGroupOptions.addMember,
            icon: MdGroupAdd,
        },
        { label: 'Delete Group', key: EditGroupOptions.delete, icon: MdDelete },
    ];

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    function itemSelectHandler(optionKey: EditGroupOptions) {
        handleClose();
        if (!props.groupData) return;
        switch (optionKey) {
            case EditGroupOptions.edit:
                setEditGroupModal(props.groupData);
                break;
            case EditGroupOptions.delete:
                setDeleteGroupModal(true);
                break;
            case EditGroupOptions.addMember:
                setAddMemberModal(props.groupData);
                break;
        }
    }

    function deleteHandler(): Promise<void> | void {
        if (!props.groupData) return;
        return new Promise<void>((resolve) => {
            del(API.group.detail(props.groupData?.id!))
                .then(() => {
                    toast.success('The group has been deleted successfully');
                    navigate(PATH.dashboard);
                })
                .catch((e) => console.log(e))
                .finally(() => resolve());
        });
    }

    return (
        <div>
            <FormGroupModal
                isOpen={!!editGroupModal}
                onClose={(needReFetch) => {
                    setEditGroupModal(undefined);
                    needReFetch && props.reFetch();
                }}
                selectedGroup={editGroupModal}
            />
            <ConfirmationModal
                onClose={() => setDeleteGroupModal(false)}
                isOpen={deleteGroupModal}
                onConfirm={deleteHandler}
                description={`Are you sure you want to delete ${props.groupData?.name} Group ?`}
            />
            <AddMemberModal
                onClose={(needReFetch) => {
                    setAddMemberModal(undefined);
                    needReFetch && props.reFetch();
                }}
                groupData={addMemberModal}
            />
            <IconButton loading={!props.groupData} onClick={handleClick}>
                <MdMoreVert />
            </IconButton>
            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                {options.map((option) => (
                    <MenuItem key={option.key} onClick={() => itemSelectHandler(option.key)}>
                        <ListItemIcon>
                            <option.icon />
                        </ListItemIcon>
                        <ListItemText> {option.label}</ListItemText>
                    </MenuItem>
                ))}
            </Menu>
        </div>
    );
}
