import { Card } from '@/utilities/components';
import { useContext, useEffect, useState } from 'react';
import { GroupRoleEnum, GroupType, SocketUserType } from '@/interfaces';
import { GroupInfoCardProps } from './type';
import { GroupDetailModal, EditGroupButton } from '@/vsharee/group/components';
import { SocketContext } from '@/context/SocketContext';
import { useParams } from 'react-router-dom';
import { userDataAtom } from '@/atom';
import { useAtomValue } from 'jotai';
import { editGroupButtonOptionsData } from '@/vsharee/group/components/editGroupButton/data';

const GroupInfoCard: React.FC<GroupInfoCardProps> = (props: GroupInfoCardProps) => {
    const [groupData, setGroupData] = useState<GroupType>();
    const [isGroupDetailModalOpen, setIsGroupDetailModalOpen] = useState(false);
    const socket = useContext(SocketContext);
    const { id } = useParams();
    const [onlineMembers, setOnlineMembers] = useState<SocketUserType[]>();
    const userData = useAtomValue(userDataAtom);
    const userRole = props.groupData?.members.find((groupMember) => groupMember.user?.id === userData?.id)?.role;
    const allPermissions = editGroupButtonOptionsData.flatMap((item) => item.permission);
    const canEdit = userRole ? allPermissions.includes(userRole) : false;

    useEffect(() => {
        if (props.groupData) setGroupData(props.groupData);
    }, [props.groupData]);

    useEffect(() => {
        if (id) {
            socket?.emit('joinGroup', { groupId: id });
        }
        socket?.on('joinedGroup', (res) => setOnlineMembers(res.onlineMembers));
        socket?.on('userJoined', (res) => {
            setOnlineMembers((prev) => [...(prev || []), res]);
        });
        socket?.on('userLeft', (res) => {
            setOnlineMembers((prev) => prev?.filter((item) => item.id !== res.id));
        });
        return () => {
            socket?.emit('leftGroup', { groupId: id });
        };
    }, [id]);

    return (
        <>
            <Card onClick={() => setIsGroupDetailModalOpen(true)}>
                <div onClick={(e) => {}} className="flex cursor-pointer flex-col gap-1">
                    <div className="flex items-center">
                        <div className="flex h-full w-full items-center gap-2">
                            <h1 className="text-md font-medium">{groupData?.name}</h1>
                            <h6 className="text-gray99 text-xs font-light">@{groupData?.id}</h6>
                            <span className="flex-1" />
                        </div>

                        {canEdit && (
                            <EditGroupButton
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                groupData={groupData}
                                reFetch={props.fetch}
                            />
                        )}
                    </div>
                    {groupData?.description && (
                        <p className="text-gray99 text-sm font-light">{groupData?.description}</p>
                    )}
                    <div className="flex items-center gap-1">
                        <p className="text-gray99 text-xs font-light">
                            {groupData?.members.length} Member{groupData?.members.length !== 0 ? 's' : ''}
                        </p>
                        {onlineMembers && (
                            <p className="text-gray99 text-xs font-light"> - {onlineMembers.length} online</p>
                        )}
                    </div>
                </div>
            </Card>
            <GroupDetailModal
                onClose={() => setIsGroupDetailModalOpen(false)}
                isOpen={isGroupDetailModalOpen}
                groupData={groupData}
                onlineMembers={onlineMembers}
            />
        </>
    );
};

export default GroupInfoCard;
