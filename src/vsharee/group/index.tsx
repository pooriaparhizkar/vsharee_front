import { useParams } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { get } from '@/scripts';
import { API } from '@/data';
import { GroupType } from '@/interfaces';
import GroupSkeleton from './skeleton';
import { SocketContext } from '@/context/SocketContext';
import { GroupInfoCard } from './sections';

const Group: React.FC = () => {
    const { id } = useParams();
    const [groupData, setGroupData] = useState<GroupType | null>();
    const socket = useContext(SocketContext);

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
        if (id) {
            fetchGroupData();
            socket.emit('joinGroup', { groupId: id });
        }

        socket.on('joinedGroup', (res) => console.log(res));
    }, [id]);

    useEffect(() => {
        return () => {
            socket.emit('leftGroup', { groupId: id });
        };
    }, []);
    return (
        <div className="flex w-full justify-center">
            <div className="mx-auto w-full max-w-[1300px]">
                {groupData !== undefined ? (
                    <div>
                        <GroupInfoCard fetch={fetchGroupData} groupData={groupData} />
                    </div>
                ) : (
                    <GroupSkeleton />
                )}
            </div>
        </div>
    );
};

export default Group;
