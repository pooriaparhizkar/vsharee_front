import Autocomplete, { AutocompleteCloseReason } from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AddMemberInputProps } from './type';
import { GroupRoleEnum, Pagination, UserType } from '@/interfaces';
import { get } from '@/scripts';
import { API } from '@/data';
import { useAtomValue } from 'jotai';
import { userDataAtom } from '@/atom';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { MdDeleteOutline } from 'react-icons/md';
import IconButton from '@mui/material/IconButton';

const DEBOUNCE_MS = 800;

const AddMemberInput: React.FC<AddMemberInputProps> = (props: AddMemberInputProps) => {
    const userData = useAtomValue(userDataAtom);

    /** The last committed selection (either defaultValue.user or a selected option) */
    const [committedValue, setCommittedValue] = useState<UserType | null>(null);

    /** The text shown in the input (fully controllable & editable) */
    const [inputValue, setInputValue] = useState<string>('');

    /** Options fetched from backend */
    const [options, setOptions] = useState<UserType[]>([]);

    /** Loading flags */
    const [typingLoading, setTypingLoading] = useState<boolean>(false); // while waiting for debounce
    const [fetchLoading, setFetchLoading] = useState<boolean>(false); // while awaiting backend
    const loading = typingLoading || fetchLoading;

    /** Popup */
    const [open, setOpen] = useState(false);

    /** Track whether close was caused by selecting an option */
    const closedBySelectionRef = useRef(false);

    const [role, setRole] = useState<GroupRoleEnum | undefined>(props.defaultValue?.role);

    /** Initialize from defaultValue.user (and react to changes) */
    useEffect(() => {
        const dv = props?.defaultValue?.user ?? null;
        setCommittedValue(dv);
        setInputValue(dv?.name ?? '');
        setRole(props.defaultValue?.role);
        console.log(props.defaultValue);
    }, [props.defaultValue]);

    /** Debounced search term */
    const [debouncedTerm, setDebouncedTerm] = useState<string>('');
    useEffect(() => {
        // If the user is typing anything (even deleting), show typing loading
        setTypingLoading(inputValue.trim().length > 0);

        const t = setTimeout(() => {
            setDebouncedTerm(inputValue.trim());
            setTypingLoading(false);
        }, DEBOUNCE_MS);

        return () => clearTimeout(t);
        // NOTE: this runs whenever inputValue changes
    }, [inputValue]);

    /** Fetch users from backend based on debounced term (or do a light fetch when opening) */
    const fetchUsers = async (term: string) => {
        if (!term && term === '') return;
        setFetchLoading(true);
        try {
            const res = await get<Pagination<UserType>>(API.profile.search(1, 50), { name: term });
            const data = res.value.value.data || [];
            const filtered = data.filter((u) => u.id !== userData?.id);
            setOptions(filtered);
        } catch {
            setOptions([]);
        } finally {
            setFetchLoading(false);
        }
    };

    /** When the popup opens (or term changes), fetch */
    useEffect(() => {
        if (!open) return;

        // If there is a term, search with it; otherwise do a light fetch (e.g., empty term)
        fetchUsers(debouncedTerm);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, debouncedTerm]);

    /** Handlers */
    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = (_: React.SyntheticEvent, reason: AutocompleteCloseReason) => {
        setOpen(false);

        // If closed due to selection, don't revert input
        if (closedBySelectionRef.current || reason === 'selectOption') {
            closedBySelectionRef.current = false;
            return;
        }

        // User clicked outside or pressed escape without choosing; revert input text
        setInputValue(committedValue?.name ?? '');
        setOptions([]);
    };

    const handleChange = (_: any, newValue: UserType | null, reason: string) => {
        // Record that we're closing due to a selection (MUI often closes right after)
        closedBySelectionRef.current = reason === 'selectOption';

        setCommittedValue(newValue);
        setInputValue(newValue?.name ?? '');
        props.onChange({ user: newValue ?? undefined, role: role ?? GroupRoleEnum.MEMBER });

        // If your parent needs the selection, call a prop callback here (if exists)
        // props.onChange?.(newValue);  // uncomment if your AddMemberInputProps defines it
    };

    const handleInputChange = (_: any, newInputValue: string, reason: string) => {
        // Allow full free editing of the input text
        setInputValue(newInputValue);

        // If user cleared the field, we still want to show loading briefly (debounce),
        // then fetch with empty term which can show generic results or none.
    };

    /** Memo helpers */
    const isOptionEqualToValue = useMemo(() => (option: UserType, value: UserType) => option.id === value.id, []);

    const getOptionLabel = (option: UserType) => option?.name ?? '';

    return (
        <div className="flex w-full items-center gap-2">
            <Autocomplete<UserType, false, false, false>
                disabled={props.defaultValue?.role === GroupRoleEnum.CREATOR}
                fullWidth
                open={open}
                onOpen={handleOpen}
                onClose={handleClose}
                options={options}
                loading={loading}
                value={committedValue}
                inputValue={inputValue}
                onChange={handleChange}
                onInputChange={handleInputChange}
                isOptionEqualToValue={isOptionEqualToValue}
                getOptionLabel={getOptionLabel}
                filterOptions={(x) => x} // do not client-filter; backend already filtered
                // Texts
                loadingText="Loading users…"
                noOptionsText={debouncedTerm ? 'No users found' : 'Type to search users'}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        placeholder={committedValue ? undefined : 'Search user…'}
                        label={undefined}
                        slotProps={{
                            input: {
                                ...params.InputProps,
                                endAdornment: (
                                    <React.Fragment>
                                        {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </React.Fragment>
                                ),
                            },
                        }}
                    />
                )}
            />
            <FormControl disabled={props.defaultValue?.role === GroupRoleEnum.CREATOR} sx={{ minWidth: 150 }}>
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                    labelId="role-label"
                    id="demo-simple-select"
                    value={role ?? ''}
                    label="Role"
                    onChange={(event) => {
                        const newRole = event.target.value as GroupRoleEnum;
                        setRole(newRole);
                        if (committedValue) props.onChange({ user: committedValue, role: newRole });
                    }}
                >
                    {Object.values(GroupRoleEnum).map((item) => (
                        <MenuItem disabled={item === GroupRoleEnum.CREATOR} key={item} value={item}>
                            {item.charAt(0) + item.slice(1).toLowerCase()}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <IconButton
                onClick={() =>
                    props.delete?.({ user: committedValue ?? undefined, role: role ?? GroupRoleEnum.MEMBER })
                }
                disabled={props.defaultValue?.role === GroupRoleEnum.CREATOR || props.isLastOne}
                color="error"
                aria-label="delete"
            >
                <MdDeleteOutline />
            </IconButton>
        </div>
    );
};

export default AddMemberInput;
