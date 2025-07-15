import { Card } from '@/utilities/components';
import { API } from '@/data';
import { GroupType, Pagination } from '@/interfaces';
import { useEffect, useState } from 'react';
import { get } from '@/scripts';
import Button from '@mui/material/Button';
import CreateGroupModal from './modals/create';
import Skeleton from '@mui/material/Skeleton';

const DashboardMyGroupsCard: React.FC = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [data, setData] = useState<GroupType[]>();

    function fetchData() {
        setData(undefined);
        get<Pagination<GroupType>>(API.group.mine(1, 100))
            .then((res) => setData(res.value.value.data))
            .catch((e) => console.log(e));
    }
    useEffect(() => {
        fetchData();
    }, []);
    return (
        <>
            <CreateGroupModal
                isOpen={isCreateModalOpen}
                onClose={(needReFetch) => {
                    setIsCreateModalOpen(false);
                    needReFetch && fetchData();
                }}
            />
            <Card
                className="max-w-[326px]"
                extra={
                    <Button onClick={() => setIsCreateModalOpen(true)} variant="contained">
                        Create
                    </Button>
                }
                title="My Groups"
            >
                {data ? (
                    data.length !== 0 ? (
                        data.map((item, index) => (
                            <div key={index} className="clickable flex items-center gap-1">
                                <div className="flex h-10 items-center gap-4">
                                    <h6 className="text-md flex-1 font-light">{item.name}</h6>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <p className="text-gray99 text-sm font-medium">No Data to Show!</p>
                        </div>
                    )
                ) : (
                    <div className="flex flex-col gap-4">
                        <Skeleton variant="rounded" height={40} />
                        <Skeleton variant="rounded" height={40} />
                        <Skeleton variant="rounded" height={40} />
                        <Skeleton variant="rounded" height={40} />
                        <Skeleton variant="rounded" height={40} />
                        <Skeleton variant="rounded" height={40} />
                    </div>
                )}
            </Card>
        </>
    );
};

export default DashboardMyGroupsCard;
