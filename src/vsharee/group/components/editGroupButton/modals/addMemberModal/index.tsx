import { Modal } from '@/utilities/components';
import { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import { AddMemberModalProps } from './type';
import Autocomplete from '@mui/material/Autocomplete';
import { UserType } from 'interfaces';
import { useAtomValue } from 'jotai';
import { userDataAtom } from '@/atom';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import { Pagination } from '@/interfaces';
import { get, put } from '@/scripts';
import { API } from '@/data';
import Chip from '@mui/material/Chip';
import { toast } from 'react-toastify';

const AddMemberModal: React.FC<AddMemberModalProps> = (props: AddMemberModalProps) => {
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState<UserType[]>(props.groupData?.members ?? []);
    const userData = useAtomValue(userDataAtom);
    const [search, setSearch] = useState('');
    const [debouncedValue, setDebouncedValue] = useState('');
    const [typingLoading, setTypingLoading] = useState(false);
    const [result, setResult] = useState<UserType[]>();

    useEffect(() => {
        if (props.groupData)
            setMembers([
                ...(userData ? [userData] : []),
                ...props.groupData.members.filter((item) => item.id !== userData?.id),
            ]);
    }, [props.groupData]);

    useEffect(() => {
        if (search.trim() === '') {
            setTypingLoading(false);
            setDebouncedValue('');
            return;
        }
        const timer = setTimeout(() => {
            setDebouncedValue(search);
        }, 1000);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (debouncedValue) {
            setTypingLoading(false);
            fetchData();
        }
    }, [debouncedValue]);

    function fetchData() {
        setResult(undefined);
        get<Pagination<UserType>>(API.profile.search(1, 50), { name: search })
            .then((res) => setResult(res.value.value.data.filter((item) => item.id !== userData?.id)))
            .catch(() => setResult([]));
    }

    function submitHandler() {
        if (!props.groupData) return;
        setLoading(true);
        put(API.group.detail(props.groupData?.id), { members: members.map((item) => item.id) })
            .then((res) => {
                toast.success('Members of the group has been updated successfully');
                props.onClose(true);
            })
            .catch((err) => console.log(err))
            .finally(() => setLoading(false));
    }

    return (
        <Modal width={600} isOpen={!!props.groupData} onClose={props.onClose} title={`Add Member`}>
            <div className="flex w-full flex-col gap-4">
                <Autocomplete
                    multiple
                    value={members}
                    onChange={(event, newValue) => {
                        console.log(newValue);
                        setMembers([
                            ...(userData ? [userData] : []),
                            ...newValue.filter((item) => item.id !== userData?.id),
                        ]);
                        setResult(undefined);
                    }}
                    options={result ?? []}
                    getOptionLabel={(option) => option.name}
                    renderValue={(values, getItemProps) =>
                        values.map((option, index) => {
                            const { key, ...itemProps } = getItemProps({ index });
                            return (
                                <Chip
                                    key={key}
                                    label={option.name}
                                    {...itemProps}
                                    disabled={option.id === userData?.id}
                                />
                            );
                        })
                    }
                    filterSelectedOptions
                    loading={typingLoading}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Search Users"
                            placeholder="Type to search..."
                            value={search}
                            onChange={(e) => {
                                setTypingLoading(true);
                                setSearch(e.target.value);
                            }}
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {typingLoading ? <CircularProgress size={16} /> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                />
                <div className="mt-4 flex w-full items-center gap-2">
                    <Button
                        size="large"
                        className="flex-2"
                        variant="contained"
                        onClick={submitHandler}
                        loading={loading}
                    >
                        Confirm
                    </Button>
                    <Button onClick={() => props.onClose()} size="large" className="flex-1" variant="text">
                        Cancel
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default AddMemberModal;
