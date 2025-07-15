import { Card } from '@/utilities/components';
import { API } from '@/data';
import { GroupType, Pagination } from '@/interfaces';
import { useEffect, useRef, useState } from 'react';
import { get } from '@/scripts';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';

const DashboardTopGroupsCard: React.FC = () => {
    const [data, setData] = useState<GroupType[]>();
    const paramsFilter = useRef<any>({ sortBy: 'members', sort: 'desc' });

    function fetchData() {
        setData(undefined);
        get<Pagination<GroupType>>(API.group.getAll(1, 100), paramsFilter.current)
            .then((res) => setData(res.value.value.data))
            .catch((e) => console.log(e));
    }
    useEffect(() => {
        fetchData();
    }, []);
    return (
        <Card className="max-w-[326px]" title="Top Groups">
            {data ? (
                data.length !== 0 ? (
                    data.map((item, index) => (
                        <div key={index} className="clickable flex items-center gap-1">
                            <div className="flex h-10 w-full items-center gap-4">
                                <h6 className="text-md flex-1 overflow-hidden font-light text-ellipsis whitespace-nowrap">
                                    {item.name}
                                </h6>
                                <span className="text-gray99 text-sm font-light">
                                    {item.members.length} Member{item.members.length > 1 ? 's' : ''}
                                </span>
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
    );
};

export default DashboardTopGroupsCard;
