import { Card } from '@/utilities/components';
import { GroupVideoPlayerProps } from './type';
import StreamVideoPlayer from './methods/stream';
import React, { useContext, useEffect, useRef, useState } from 'react';
import ButtonGroup from '@mui/material/ButtonGroup';
import Button from '@mui/material/Button';
import { MdArrowDropDown } from 'react-icons/md';
import Popper from '@mui/material/Popper';
import Grow from '@mui/material/Grow';
import Paper from '@mui/material/Paper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import { GroupRoleEnum } from '@/interfaces';
import { useAtomValue } from 'jotai';
import { userDataAtom } from '@/atom';
import { VideoPlayingMethodsData } from './methods/data';
import { VideoPlayingMethodsEnum } from './methods/type';
import { SocketContext } from '@/context/SocketContext';
import UrlVideoPlayer from './methods/url';
import LocalVideoPlayer from './methods/local';

const GroupVideoPlayer: React.FC<GroupVideoPlayerProps> = (props: GroupVideoPlayerProps) => {
    const [myRole, setMyRole] = useState<GroupRoleEnum>();
    const [open, setOpen] = React.useState(false);
    const anchorRef = useRef<HTMLDivElement>(null);
    const userData = useAtomValue(userDataAtom);
    const [selectedItem, setSelectedItem] = useState<{ title: string; key: VideoPlayingMethodsEnum }>();
    const [isChosen, setIsChosen] = useState(false);
    const socket = useContext(SocketContext);

    useEffect(() => {
        if (props.groupData) setMyRole(props.groupData.members.find((item) => item.user?.id === userData?.id)?.role);
    }, [props.groupData]);

    const handleClick = () => {
        setIsChosen(true);
        if (props.groupData?.id && selectedItem)
            socket?.emit('methodSelected', { groupId: props.groupData?.id, method: selectedItem?.key });
    };

    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen);
    };

    const handleClose = (event: Event) => {
        if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
            return;
        }

        setOpen(false);
    };

    useEffect(() => {
        socket?.on('methodSelected', (res) => {
            setSelectedItem(VideoPlayingMethodsData.find((item) => item.key === res.method));
            setIsChosen(true);
        });

        socket?.on('contentReset', () => {
            setIsChosen(false);
            setSelectedItem(undefined);
        });
    }, []);
    return (
        <Card className={`flex-1 overflow-hidden !p-0`}>
            {isChosen ? (
                <>
                    {selectedItem?.key === VideoPlayingMethodsEnum.STREAM && <StreamVideoPlayer myRole={myRole} />}
                    {selectedItem?.key === VideoPlayingMethodsEnum.URL && <UrlVideoPlayer myRole={myRole} />}
                    {selectedItem?.key === VideoPlayingMethodsEnum.LOCAL && <LocalVideoPlayer myRole={myRole} />}
                </>
            ) : (
                <div className="flex h-full w-full flex-1 items-center justify-center">
                    {myRole && [GroupRoleEnum.CONTROLLER, GroupRoleEnum.CREATOR].includes(myRole) ? (
                        <>
                            <ButtonGroup
                                variant="contained"
                                ref={anchorRef}
                                aria-label="Button group with a nested menu"
                            >
                                <Button disabled={!selectedItem} onClick={handleClick}>
                                    {!!selectedItem ? selectedItem.title : 'Chose Method'}
                                </Button>
                                <Button
                                    size="small"
                                    aria-controls={open ? 'split-button-menu' : undefined}
                                    aria-expanded={open ? 'true' : undefined}
                                    aria-label="select merge strategy"
                                    aria-haspopup="menu"
                                    onClick={handleToggle}
                                >
                                    <MdArrowDropDown />
                                </Button>
                            </ButtonGroup>
                            <Popper
                                sx={{ zIndex: 1 }}
                                open={open}
                                anchorEl={anchorRef.current}
                                role={undefined}
                                transition
                                disablePortal
                            >
                                {({ TransitionProps, placement }) => (
                                    <Grow
                                        {...TransitionProps}
                                        style={{
                                            transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
                                        }}
                                    >
                                        <Paper>
                                            <ClickAwayListener onClickAway={handleClose}>
                                                <MenuList id="split-button-menu" autoFocusItem>
                                                    {VideoPlayingMethodsData.map((item) => (
                                                        <MenuItem
                                                            key={item.key}
                                                            selected={selectedItem?.key === item.key}
                                                            onClick={() => {
                                                                setOpen(false);
                                                                setSelectedItem(item);
                                                            }}
                                                        >
                                                            {item.title}
                                                        </MenuItem>
                                                    ))}
                                                </MenuList>
                                            </ClickAwayListener>
                                        </Paper>
                                    </Grow>
                                )}
                            </Popper>
                        </>
                    ) : (
                        <h1 className="text-md text-gray99 text-center font-medium">
                            Wait for qualified people to select the method...
                        </h1>
                    )}
                </div>
            )}
        </Card>
    );
};

export default GroupVideoPlayer;
