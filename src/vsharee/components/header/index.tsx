import { useAtom, useSetAtom } from 'jotai';
import { authStatusAtom, userDataAtom } from '@/atom';
import { AuthStatus } from '@/interfaces';
import { authToken } from '@/scripts';
import Logo from '@/assets/images/logo.png';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import { useState } from 'react';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Search from './search';
import { Link } from 'react-router-dom';
import SocketStatus from '../socketStatus';

const Header: React.FC = () => {
    const [userData, setUserData] = useAtom(userDataAtom);
    const setAuthStatus = useSetAtom(authStatusAtom);
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    function logout() {
        authToken.remove();
        setUserData(null);
        setAuthStatus(AuthStatus.inValid);
    }

    return (
        <div className="border-primary fixed top-0 left-0 z-10 flex max-h-20 min-h-20 w-full items-center justify-center border-b p-4 backdrop-blur-lg">
            <div className="flex h-full w-full max-w-[1300px] items-center gap-2">
                <div className="flex h-full w-full items-center gap-6">
                    <Link to="/">
                        <img className="clickable h-14" src={Logo} alt="vsharee" />
                    </Link>
                    <Search />
                </div>
                <span className="flex-1" />
                <Button variant="outlined" onClick={handleClick}>
                    <div className="flex items-center gap-2">
                        <SocketStatus />
                        {userData?.name}
                    </div>
                </Button>
                <Popover
                    open={Boolean(anchorEl)}
                    anchorEl={anchorEl}
                    onClose={handleClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}
                >
                    <MenuList>
                        <MenuItem
                            onClick={() => {
                                logout();
                                handleClose();
                            }}
                        >
                            Logout
                        </MenuItem>
                    </MenuList>
                </Popover>
            </div>
        </div>
    );
};

export default Header;
