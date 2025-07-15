import { useParams } from 'react-router-dom';
import { Card } from '@/utilities/components';
import { useContext, useEffect, useState } from 'react';
import { get } from '@/scripts';
import { API } from '@/data';
import { GroupType } from '@/interfaces';
import GroupSkeleton from './skeleton';
import { EditGroupButton, GroupDetailModal } from './components';
import { SocketContext } from '@/context/SocketContext';

const Group: React.FC = () => {
    const { id } = useParams();
    const [groupData, setGroupData] = useState<GroupType | null>();
    const [isGroupDetailModalOpen, setIsGroupDetailModalOpen] = useState(false);
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
            <GroupDetailModal
                onClose={() => setIsGroupDetailModalOpen(false)}
                isOpen={isGroupDetailModalOpen}
                groupData={groupData}
            />
            <div className="mx-auto w-full max-w-[1300px]">
                {groupData !== undefined ? (
                    <div>
                        <Card>
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

                                    <EditGroupButton groupData={groupData} reFetch={fetchGroupData} />
                                </div>
                                {groupData?.description && (
                                    <p className="text-gray99 text-md font-light">{groupData?.description}</p>
                                )}
                            </div>
                        </Card>
                    </div>
                ) : (
                    <GroupSkeleton />
                )}
            </div>
        </div>
    );
};

export default Group;
