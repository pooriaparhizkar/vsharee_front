import { DashboardMyGroupsCard, DashboardInfoCard, DashboardTopGroupsCard } from './Cards';

const Dashboard: React.FC = () => {
    return (
        <div className="flex h-full w-full flex-1 flex-col items-center justify-center">
            <div className="mx-auto flex h-full w-full max-w-[1300px] flex-1 justify-between">
                <DashboardMyGroupsCard />
                <DashboardInfoCard />
                <DashboardTopGroupsCard />
            </div>
        </div>
    );
};

export default Dashboard;
