import { Modal } from '@/utilities/components';
import { useState } from 'react';
import Button from '@mui/material/Button';
import { ConfirmationModalProps } from './type';

const ConfirmationModal: React.FC<ConfirmationModalProps> = (props: ConfirmationModalProps) => {
    const [loading, setLoading] = useState(false);
    function confirmHandler() {
        props.onConfirm();
        setLoading(true);
        Promise.resolve(props.onConfirm?.()).finally(() => {
            setLoading(false);
        });
    }
    return (
        <Modal isOpen={props.isOpen} onClose={props.onClose} title={props.title ?? 'Are you sure ?'}>
            <div className="flex flex-col gap-4">
                <p className="text-md font-medium">{props.description}</p>
                <div className="flex flex-col gap-4">
                    <div className="mt-4 flex w-full items-center gap-2">
                        <Button
                            size="large"
                            className="flex-2"
                            variant="contained"
                            onClick={confirmHandler}
                            loading={loading}
                        >
                            {props.submitButtonText ?? 'Confirm'}
                        </Button>
                        <Button onClick={props.onClose} size="large" className="flex-1" variant="text">
                            {props.cancelButtonText ?? 'Cancel'}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;
