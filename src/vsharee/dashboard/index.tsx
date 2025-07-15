import DashboardIcon from '@/assets/images/dashboard-icon.svg';
import DashboardMyGroupsCard from './Cards/myGroups';

const Dashboard: React.FC = () => {
    return (
        <div className="flex h-full w-full flex-1 flex-col items-center justify-center">
            <div className="mx-auto flex h-full w-full max-w-[1300px] flex-1 justify-between">
                <DashboardMyGroupsCard />
                <div className="m-auto flex h-full w-[326px] flex-col items-center justify-center gap-8 px-6">
                    <img className="mx-auto w-[250px]" src={DashboardIcon} alt="dashboard" />
                    <label className="mx-auto text-center text-2xl text-white">Welcome!</label>
                    <div className="flex flex-col gap-4">
                        <h6>This is your brand, shiny server. Here are some steps to help you et stared:</h6>
                        <div className="text-gray99 flex flex-col gap-2 text-sm">
                            <div className="flex items-center gap-2">
                                <span>●</span>
                                <p>Create Your Group</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>●</span>
                                <p>Personalize your group with an icon</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>●</span>
                                <p>Invite your friends</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>●</span>
                                <p>Enjoy!</p>
                            </div>
                        </div>
                    </div>
                </div>
                <DashboardMyGroupsCard />
            </div>
        </div>
    );
};

export default Dashboard;
