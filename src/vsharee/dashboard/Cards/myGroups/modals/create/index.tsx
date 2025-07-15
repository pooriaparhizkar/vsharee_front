import { Input, Modal } from '@/utilities/components';
import { useEffect, useState } from 'react';
import { CreateGroupModalType } from './type';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { get, post } from '@/scripts';
import { API } from '@/data';
import { toast } from 'react-toastify';

const CreateGroupModal: React.FC<CreateGroupModalType> = (props: CreateGroupModalType) => {
    const [id, setId] = useState<string>('');
    const [name, setName] = useState<string>();
    const [description, setDescription] = useState<string>();
    const [verifyingIdLoading, setVerifyingLoading] = useState(false);
    const [debouncedValue, setDebouncedValue] = useState('');
    const [isIdExist, setIsIdExist] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const changeIdHandler = (value: string) => {
        setVerifyingLoading(true);
        setId(value);
    };

    // Debounce logic
    useEffect(() => {
        if (id?.trim() === '') {
            setVerifyingLoading(false);
            setDebouncedValue('');
            return;
        }
        const timer = setTimeout(() => {
            setDebouncedValue(id);
        }, 1500);

        return () => {
            clearTimeout(timer);
        };
    }, [id]);

    useEffect(() => {
        if (debouncedValue) {
            setVerifyingLoading(false);
            fetchVerify();
        }
    }, [debouncedValue]);

    function fetchVerify() {
        post(API.group.verifyId, { id }, true)
            .then((res) => setIsIdExist(false))
            .catch((e) => setIsIdExist(true));
    }

    function createGroupHandler() {
        setSubmitLoading(true);
        const body = { id, name, description };
        post(API.group.index, body)
            .then(() => {
                toast.success(`Your Group has been created successfully`);
                props.onClose(true);
            })
            .catch((e) => console.log(e));
    }

    return (
        <Modal isOpen={props.isOpen} onClose={props.onClose} title="Create Group">
            <div className="flex flex-col gap-4">
                <Input
                    required
                    label="ID"
                    value={id}
                    onChange={changeIdHandler}
                    endIcon={verifyingIdLoading && <CircularProgress size={16} />}
                    error={isIdExist}
                    helperText={isIdExist ? 'This ID is in used' : undefined}
                />

                <Input required label="Name" onChange={(e) => setName(e)} value={name} />
                <Input label="Description" onChange={(e) => setDescription(e)} value={description} />
                <div className="mt-4 flex w-full items-center gap-2">
                    <Button
                        disabled={verifyingIdLoading || isIdExist || !id || id === '' || !name || name === ''}
                        size="large"
                        className="flex-2"
                        variant="contained"
                        onClick={createGroupHandler}
                        loading={submitLoading}
                    >
                        Create
                    </Button>
                    <Button size="large" className="flex-1" variant="text">
                        Cancel
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default CreateGroupModal;
