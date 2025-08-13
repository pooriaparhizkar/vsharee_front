import { SocketContext } from '@/context/SocketContext';
import { useContext, useEffect, useState } from 'react';
import { useRef } from 'react';
import { useParams } from 'react-router-dom';
import { SocketMessageType } from '@/interfaces';
import { useAtomValue } from 'jotai';
import { userDataAtom } from '@/atom';
import Badge from '@mui/material/Badge';
import Fab from '@mui/material/Fab';
import { MdMessage, MdSend } from 'react-icons/md';
import { GroupChatMobileProps } from './type';
import Drawer from '@mui/material/Drawer';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import { Card, Input } from '@/utilities/components';
import './style.scss';

const GroupChatMobile: React.FC<GroupChatMobileProps> = (props: GroupChatMobileProps) => {
    const socket = useContext(SocketContext);
    const { id } = useParams();
    const userData = useAtomValue(userDataAtom);
    const [newMessage, setNewMessage] = useState<string>('');
    const newMessageRef = useRef('');
    const [messages, setMessages] = useState<SocketMessageType[]>(props.initialMessages ?? []);
    const [sendingLoading, setSendingLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const isOpenRef = useRef(false);
    const [newMessagesCount, setNewMessagesCount] = useState(0);

    useEffect(() => {
        if (props.initialMessages) setMessages(props.initialMessages);
    }, [props.initialMessages]);

    useEffect(() => {
        socket?.on('newMessage', (res) => {
            if (!isOpenRef.current) setNewMessagesCount((prev) => prev + 1);
            setMessages((prev) => [...(prev || []), res]);
            if (res.user.id === userData?.id && newMessageRef.current === res.message) {
                setSendingLoading(false);
                setNewMessage('');
                newMessageRef.current = '';
            }
        });
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        });
    }, [isOpen]);

    function sendMessageHandler() {
        setSendingLoading(true);
        if (id) {
            socket?.emit('sendMessage', { groupId: id, message: newMessage });
        }
    }

    function toggleOpen(isOpen: boolean) {
        if (isOpen) setNewMessagesCount(0);
        setIsOpen(isOpen);
        isOpenRef.current = isOpen;
    }

    return (
        <div
            className={`vsharee-group-chat-float-button absolute right-8 bottom-8 ${newMessagesCount !== 0 ? 'buzz' : ''}`}
        >
            <Badge
                onClick={() => toggleOpen(true)}
                className="badge"
                overlap="circular"
                badgeContent={newMessagesCount}
                color="primary"
            >
                <Fab className="float-button" color="primary">
                    <MdMessage size={32} />
                </Fab>
            </Badge>
            <Drawer
                classes={{ paperAnchorBottom: '!bg-none !bg-transparent' }}
                anchor="bottom"
                open={isOpen}
                onClose={() => toggleOpen(false)}
            >
                <Card
                    title="Chat"
                    className="flex h-full max-h-[500px] !w-auto flex-2 flex-col overflow-hidden !rounded-b-none"
                >
                    <div className="flex flex-1 flex-col overflow-hidden">
                        <div ref={scrollRef} className="flex flex-1 flex-col gap-4 overflow-y-auto pr-2">
                            {messages ? (
                                messages.length !== 0 ? (
                                    messages.map((item, index) => (
                                        <div key={index} className="flex gap-1">
                                            <label className="text-sm font-light">{item.user.name} :</label>
                                            <p className="text-gray99 text-sm font-light">{item.message}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p>No Data to Show!</p>
                                )
                            ) : (
                                <>
                                    <Skeleton variant="rounded" height={10} />
                                    <Skeleton variant="rounded" height={10} />
                                    <Skeleton variant="rounded" height={10} />
                                    <Skeleton variant="rounded" height={10} />
                                    <Skeleton variant="rounded" height={10} />
                                </>
                            )}
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                            <Input
                                size="small"
                                onEnter={sendMessageHandler}
                                value={newMessage}
                                label="Type here..."
                                onChange={(e) => {
                                    setNewMessage(e);
                                    newMessageRef.current = e;
                                }}
                            />
                            <IconButton loading={sendingLoading} disabled={!id} onClick={sendMessageHandler}>
                                <MdSend />
                            </IconButton>
                        </div>
                    </div>
                </Card>
            </Drawer>
        </div>
    );
};

export default GroupChatMobile;
