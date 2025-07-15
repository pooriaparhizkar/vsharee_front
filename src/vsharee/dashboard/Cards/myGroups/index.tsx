import { Card, Modal } from '@/utilities/components';
import { API } from '@/data';
import { GroupType, Pagination } from '@/interfaces';
import { useEffect, useState } from 'react';
import { get } from '@/scripts';
import Button from '@mui/material/Button';
import Backdrop from '@mui/material/Backdrop';

const DashboardMyGroupsCard: React.FC = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [data, setData] = useState<GroupType[]>();
    useEffect(() => {
        get<Pagination<GroupType>>(API.group.mine(1, 100))
            .then((res) => setData(res.value.value.data))
            .catch((e) => console.log(e));
    }, []);
    return (
        <>
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Group">
                <h1>test</h1>
            </Modal>
            <Card
                className="max-w-[326px]"
                extra={
                    <Button onClick={() => setIsCreateModalOpen(true)} variant="contained">
                        Create
                    </Button>
                }
                title="My Groups"
            >
                <h1>My Groups</h1>
                {data?.map((item, index) => (
                    <div key={index} className="flex items-center gap-1">
                        <h6>{item.name}</h6>
                    </div>
                ))}
            </Card>
        </>
    );
};

export default DashboardMyGroupsCard;
