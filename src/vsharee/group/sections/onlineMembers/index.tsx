import { Card } from '@/utilities/components';
import { SocketContext } from '@/context/SocketContext';
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Skeleton from '@mui/material/Skeleton';

const OnlineMembersCard: React.FC = () => {
    const socket = useContext(SocketContext);
    const { id } = useParams();
    const [onlineMembers, setOnlineMembers] = useState<{ id: string; name: string }[]>();

    useEffect(() => {
        if (id) {
            socket.emit('joinGroup', { groupId: id });
        }
        socket.on('joinedGroup', (res) => setOnlineMembers(res.onlineMembers));
        socket.on('userJoined', (res) => {
            setOnlineMembers((prev) => [...(prev || []), res]);
        });
        socket.on('userLeft', (res) => {
            setOnlineMembers((prev) => prev?.filter((item) => item.id !== res.id));
        });
        return () => {
            socket.emit('leftGroup', { groupId: id });
        };
    }, [id]);

    return (
        <Card title="Online Members" className="max-w-[326px]">
            {onlineMembers ? (
                onlineMembers.length !== 0 ? (
                    <div className="flex flex-col gap-4">
                        {onlineMembers.map((item) => (
                            <h6 key={item?.id}>- {item?.name}</h6>
                        ))}
                    </div>
                ) : (
                    <span>No data to show!</span>
                )
            ) : (
                <>
                    <Skeleton variant="rounded" height={30} />
                    <Skeleton variant="rounded" height={30} />
                    <Skeleton variant="rounded" height={30} />
                    <Skeleton variant="rounded" height={30} />
                </>
            )}
        </Card>
    );
};

export default OnlineMembersCard;
