import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { get } from '@/scripts';
import { API } from '@/data';
import { GroupType } from '@/interfaces';
import GroupSkeleton from './skeleton';
import MainGroupComponent from './main';

const Group: React.FC = () => {
    const { id } = useParams();
    const [groupData, setGroupData] = useState<GroupType | null>();

    function fetchGroupData() {
        if (id) {
            get<GroupType>(API.group.detail(id))
                .then((res) => {
                    setGroupData(res.value.value);
                })
                .catch((e) => setGroupData(null));
        }
    }
    useEffect(() => {
        if (id) fetchGroupData();
    }, [id]);

    return (
        <div className="flex h-full w-full flex-1 flex-col justify-center">
            <div className="mx-auto flex h-full w-full max-w-[1300px] flex-1 flex-col">
                {groupData !== undefined ? (
                    <MainGroupComponent fetch={fetchGroupData} groupData={groupData} />
                ) : (
                    <GroupSkeleton />
                )}
            </div>
        </div>
    );
};

export default Group;
