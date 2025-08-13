import { Input, Modal } from '@/utilities/components';
import { useEffect, useRef, useState } from 'react';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { get, post, put } from '@/scripts';
import { API } from '@/data';
import { toast } from 'react-toastify';
import { FormGroupModalType } from './type';

const FormGroupModal: React.FC<FormGroupModalType> = (props: FormGroupModalType) => {
    const [id, setId] = useState<string>(props.selectedGroup?.id ?? '');
    const [name, setName] = useState<string | undefined>(props.selectedGroup?.name);
    const [description, setDescription] = useState<string | undefined>(props.selectedGroup?.description);
    const [verifyingIdLoading, setVerifyingLoading] = useState(false);
    const [debouncedValue, setDebouncedValue] = useState('');
    const [isIdExist, setIsIdExist] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const isUnchangedInputRef = useRef<boolean>(false);

    function resetValue() {
        setId('');
        setName(undefined);
        setDescription(undefined);
        setVerifyingLoading(false);
        setDebouncedValue('');
        setIsIdExist(false);
        setSubmitLoading(false);
    }

    useEffect(() => {
        if (props.selectedGroup) {
            setId(props.selectedGroup.id);
            setName(props.selectedGroup.name);
            setDescription(props.selectedGroup.description);
            isUnchangedInputRef.current = true;
        }
    }, [props.selectedGroup]);

    const changeIdHandler = (value: string) => {
        isUnchangedInputRef.current = value === props.selectedGroup?.id;
        setVerifyingLoading(value !== props.selectedGroup?.id);
        setId(value);
    };

    // Debounce logic
    useEffect(() => {
        if (isUnchangedInputRef.current) return;
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

    function submitHandler() {
        setSubmitLoading(true);
        const body = { id, name, description };
        if (props.selectedGroup)
            put(API.group.detail(props.selectedGroup.id), body)
                .then(() => {
                    toast.success(`Your Group has been modified successfully`);
                    closeModal(true);
                })
                .catch((e) => console.log(e));
        else
            post(API.group.index, body)
                .then(() => {
                    toast.success(`Your Group has been created successfully`);
                    closeModal(true);
                })
                .catch((e) => console.log(e));
    }

    function closeModal(needRefetch?: boolean) {
        props.onClose(needRefetch);
        resetValue();
    }

    return (
        <Modal
            isOpen={props.isOpen}
            onClose={() => closeModal()}
            title={`${props.selectedGroup ? 'Edit' : 'Create'} Group`}
        >
            <div className="flex flex-col gap-4 pt-2">
                <Input
                    required
                    label="ID"
                    value={id}
                    onChange={changeIdHandler}
                    endIcon={verifyingIdLoading && <CircularProgress size={16} />}
                    error={isIdExist}
                    helperText={isIdExist ? 'This ID is in used' : undefined}
                    sx={{
                        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: isIdExist ? '#eb3942' : 'green',
                        },
                    }}
                />

                <Input required label="Name" onChange={(e) => setName(e)} value={name} />
                <Input label="Description" onChange={(e) => setDescription(e)} value={description} />
                <div className="mt-4 flex w-full items-center gap-2">
                    <Button
                        disabled={verifyingIdLoading || isIdExist || !id || id === '' || !name || name === ''}
                        size="large"
                        className="flex-2"
                        variant="contained"
                        onClick={submitHandler}
                        loading={submitLoading}
                    >
                        Apply
                    </Button>
                    <Button onClick={() => closeModal()} size="large" className="flex-1" variant="text">
                        Cancel
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default FormGroupModal;
