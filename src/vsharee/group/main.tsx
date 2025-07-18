import { useEffect, useState } from 'react';
import { GroupType } from '@/interfaces';
import { GroupChatCard, GroupInfoCard, GroupVideoPlayer } from './sections';

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
                <GroupVideoPlayer />
                <GroupChatCard />
            </div>
        </div>
    );
};

export default MainGroupComponent;
