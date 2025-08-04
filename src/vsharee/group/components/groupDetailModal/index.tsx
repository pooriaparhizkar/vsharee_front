import { Modal } from '@/utilities/components';
import { GroupDetailModalProps } from './type';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import { GroupRoleEnum } from '@/interfaces';

const GroupDetailModal: React.FC<GroupDetailModalProps> = (props: GroupDetailModalProps) => {
    return (
        <Modal isOpen={props.isOpen} onClose={props.onClose} title="Group Detail">
            <div className="flex w-full flex-col gap-4">
                <div className="flex items-center gap-2">
                    <label className="text-md font-light">Name: </label>
                    <span className="text-ms text-gray99 font-light"> {props.groupData?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-md font-light">Id: </label>
                    <span className="text-ms text-gray99 font-light"> {props.groupData?.id}</span>
                </div>
                {props.groupData?.description && (
                    <div className="flex items-center gap-2">
                        <label className="text-md font-light">Description: </label>
                        <span className="text-gray99 text-sm font-light"> {props.groupData?.description}</span>
                    </div>
                )}
                <Divider />
                {props.groupData?.members && props.groupData?.members.length !== 0 && (
                    <div className="flex max-h-[400px] flex-col gap-2 overflow-auto">
                        <label className="text-md font-light">Members: </label>
                        {props.groupData.members.map((item, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <span> - </span>
                                {props.onlineMembers?.some((onlineMember) => onlineMember.id === item.user?.id) && (
                                    <Tooltip title="Online">
                                        <div className="h-2 w-2 rounded-full bg-green-500" />
                                    </Tooltip>
                                )}
                                <h6 className="text-md font-medium">{item.user?.name}</h6>
                                <p className="text-gray99 text-sm font-light">{item.user?.email}</p>
                                {item.role === GroupRoleEnum.CREATOR ? (
                                    <Chip size="small" label={item.role} color="warning" variant="outlined" />
                                ) : item.role === GroupRoleEnum.CONTROLLER ? (
                                    <Chip size="small" label={item.role} color="primary" variant="outlined" />
                                ) : undefined}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default GroupDetailModal;
