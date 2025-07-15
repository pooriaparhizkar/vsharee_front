import { Modal } from '@/utilities/components';
import { GroupDetailModalProps } from './type';
import Divider from '@mui/material/Divider';

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
                        <span className="text-ms text-gray99 font-light"> {props.groupData?.description}</span>
                    </div>
                )}
                <Divider />
                {props.groupData?.members && props.groupData?.members.length !== 0 && (
                    <div className="flex max-h-[400px] flex-col gap-2 overflow-auto">
                        <label className="text-md font-light">Members: </label>
                        {props.groupData.members.map((item) => (
                            <div key={item.id} className="flex items-center gap-2">
                                <span> - </span>
                                <h6 className="text-md font-medium">{item.name}</h6>
                                <p className="text-gray99 text-sm font-light">{item.email}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default GroupDetailModal;
