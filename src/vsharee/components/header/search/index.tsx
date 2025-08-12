import { useState, useEffect, useRef } from 'react';
import { Input } from '@/utilities/components';
import CircularProgress from '@mui/material/CircularProgress';
import { Popover } from 'react-tiny-popover';
import { Pagination, UserType } from '@/interfaces';
import { get } from '@/scripts';
import { API, PATH } from '@/data';
import Skeleton from '@mui/material/Skeleton';
import { Link } from 'react-router-dom';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import { FaRegUser } from 'react-icons/fa6';

const Search: React.FC = () => {
    const WIDTH = 200;
    const [search, setSearch] = useState<string>('');
    const [debouncedValue, setDebouncedValue] = useState('');
    const [typingLoading, setTypingLoading] = useState(false);
    const [isResultContainerOpen, setIsResultContainerOpen] = useState(false);
    const [result, setResult] = useState<UserType[]>();
    const searchHandling = (value: string) => {
        setTypingLoading(true);
        setSearch(value);
    };

    // Debounce logic
    useEffect(() => {
        if (search.trim() === '') {
            setIsResultContainerOpen(false);
            setTypingLoading(false);
            setDebouncedValue('');
            return;
        }
        const timer = setTimeout(() => {
            setDebouncedValue(search);
        }, 1500);

        return () => {
            clearTimeout(timer);
        };
    }, [search]);

    useEffect(() => {
        if (debouncedValue) {
            setTypingLoading(false);
            setIsResultContainerOpen(true);
            fetchData();
        }
    }, [debouncedValue]);

    function fetchData() {
        setResult(undefined);
        get<Pagination<UserType>>(API.profile.search(1, 100), { name: search })
            .then((res) => setResult(res.value.value.data))
            .catch((e) => setResult([]));
    }

    return (
        <Popover
            reposition
            align="start"
            isOpen={isResultContainerOpen}
            containerClassName="z-10"
            positions={['bottom']} // preferred positions by priority
            onClickOutside={() => {
                setIsResultContainerOpen(false);
                setSearch('');
            }}
            content={
                <div className="text-red border-primary bg-background/10 z-10 h-full w-[300px] rounded-b-sm border-2 border-t-0 backdrop-blur-lg">
                    {result ? (
                        result.length !== 0 ? (
                            <MenuList>
                                {result.map((item, index) => (
                                    // <Link target="_blank" to={PATH.profile(item.id)}>
                                    <MenuItem className="flex items-center gap-2" key={index}>
                                        <FaRegUser />
                                        {item.name}
                                    </MenuItem>
                                    // </Link>
                                ))}
                            </MenuList>
                        ) : (
                            <p>No Data</p>
                        )
                    ) : (
                        <div className="flex flex-col gap-4">
                            <Skeleton variant="rounded" height={30} />
                            <Skeleton variant="rounded" height={30} />
                            <Skeleton variant="rounded" height={30} />
                        </div>
                    )}
                </div>
            }
        >
            <Input
                isFocus={isResultContainerOpen === true ? true : undefined}
                className="max-w-[300px]"
                label="Search"
                value={search}
                onChange={searchHandling}
                endIcon={typingLoading && <CircularProgress size={16} />}
                sx={{
                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#eb3942',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                        color: '#eb3942',
                    },
                    '& .MuiInputBase-root': {
                        borderRadius: isResultContainerOpen ? '4px 4px 0 0' : '4px',
                    },
                }}
            />
        </Popover>
    );
};

export default Search;
