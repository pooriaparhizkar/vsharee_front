import { useEffect, useState } from 'react';
import { GroupType } from '@/interfaces';
import { GroupChatCard, GroupInfoCard } from './sections';
import { Card } from '@/utilities/components';

interface MainGroupComponentProps {
    fetch: () => void;
    groupData?: GroupType | null;
}
const MainGroupComponent: React.FC<MainGroupComponentProps> = (props: MainGroupComponentProps) => {
    const [groupData, setGroupData] = useState<GroupType | null>();

    useEffect(() => {
        if (props.groupData) setGroupData(props.groupData);
    }, [props.groupData]);
    return (
        <div className="flex h-full flex-1 flex-col gap-4 overflow-hidden">
            <GroupInfoCard fetch={props.fetch} groupData={groupData} />
            <div className="flex h-full flex-1 gap-4 overflow-hidden">
                <Card className="flex-1 bg-black">
                    <h1>Video Player</h1>
                </Card>
                <GroupChatCard />
            </div>
        </div>
    );
};

export default MainGroupComponent;
