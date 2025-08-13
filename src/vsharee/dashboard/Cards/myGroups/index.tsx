import { Card } from '@/utilities/components';
import { API, PATH } from '@/data';
import { GroupType, Pagination } from '@/interfaces';
import { useEffect, useState } from 'react';
import { get } from '@/scripts';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import { Link } from 'react-router-dom';
import { FormGroupModal } from '@/vsharee/components';

const DashboardMyGroupsCard: React.FC = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [data, setData] = useState<GroupType[]>();
    const [selectedGroup, setSelectedGroup] = useState<GroupType>();

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
            <FormGroupModal
                isOpen={isCreateModalOpen}
                onClose={(needReFetch) => {
                    setIsCreateModalOpen(false);
                    setSelectedGroup(undefined);
                    needReFetch && fetchData();
                }}
                selectedGroup={selectedGroup}
            />
            <Card
                className="max-w-[326px] max-md:max-w-full max-md:flex-1"
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
                            <div key={index} className="flex h-10 items-center gap-1">
                                <Link className="flex-1" to={PATH.group(item.id)}>
                                    <h6 className="text-md clickable font-light">{item.name}</h6>
                                </Link>
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
