import Skeleton from '@mui/material/Skeleton';

const GroupSkeleton: React.FC = () => {
    return (
        <div className="flex w-full flex-col gap-1">
            <Skeleton variant="rounded" height={60} />
        </div>
    );
};

export default GroupSkeleton;
