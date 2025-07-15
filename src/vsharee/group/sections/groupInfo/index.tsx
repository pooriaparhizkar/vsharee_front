import { Card } from '@/utilities/components';
import { useEffect, useState } from 'react';
import { GroupType } from '@/interfaces';
import { GroupInfoCardProps } from './type';
import { GroupDetailModal, EditGroupButton } from '@/vsharee/group/components';

const GroupInfoCard: React.FC<GroupInfoCardProps> = (props: GroupInfoCardProps) => {
    const [groupData, setGroupData] = useState<GroupType>();
    const [isGroupDetailModalOpen, setIsGroupDetailModalOpen] = useState(false);

    useEffect(() => {
        if (props.groupData) setGroupData(props.groupData);
    }, [props.groupData]);

    return (
        <Card>
            <GroupDetailModal
                onClose={() => setIsGroupDetailModalOpen(false)}
                isOpen={isGroupDetailModalOpen}
                groupData={groupData}
            />
            <div className="flex cursor-pointer flex-col gap-4">
                <div className="flex items-center">
                    <div
                        onClick={() => setIsGroupDetailModalOpen(true)}
                        className="flex h-full w-full items-center gap-2"
                    >
                        <h1 className="text-md font-medium">{groupData?.name}</h1>
                        <h6 className="text-gray99 text-sm font-light">@{groupData?.id}</h6>
                        <span className="flex-1" />
                    </div>

                    <EditGroupButton groupData={groupData} reFetch={props.fetch} />
                </div>
                {groupData?.description && <p className="text-gray99 text-md font-light">{groupData?.description}</p>}
            </div>
        </Card>
    );
};

export default GroupInfoCard;
