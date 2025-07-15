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
import { useNavigate } from 'react-router-dom';
import Search from './search';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
    const [userData, setUserData] = useAtom(userDataAtom);
    const setAuthStatus = useSetAtom(authStatusAtom);
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const navigate = useNavigate();

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
        <div className="border-primary fixed top-0 left-0 z-10 flex max-h-20 min-h-20 w-full items-center justify-center border-b p-4">
            <div className="flex h-full w-full max-w-[1300px] items-center">
                <div className="flex h-full w-full items-center gap-6">
                    <Link to="/">
                        <img className="clickable h-14" src={Logo} alt="vsharee" />
                    </Link>
                    <Search />
                </div>
                <span className="flex-1" />
                <Button variant="outlined" onClick={handleClick}>
                    {userData?.name}
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
                                navigate('/profile');
                                handleClose();
                            }}
                        >
                            Profile
                        </MenuItem>
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
