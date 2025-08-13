import { Card, Input } from '@/utilities/components';
import { SocketContext } from '@/context/SocketContext';
import { useContext, useEffect, useState } from 'react';
import { useRef } from 'react';
import { useParams } from 'react-router-dom';
import { SocketMessageType } from '@/interfaces';
import Skeleton from '@mui/material/Skeleton';
import { useAtomValue } from 'jotai';
import { userDataAtom } from '@/atom';
import { MdSend } from 'react-icons/md';
import IconButton from '@mui/material/IconButton';
import { GroupChatDesktopProps } from './type';

const GroupChatDesktop: React.FC<GroupChatDesktopProps> = (props: GroupChatDesktopProps) => {
    const socket = useContext(SocketContext);
    const { id } = useParams();
    const userData = useAtomValue(userDataAtom);
    const [newMessage, setNewMessage] = useState<string>('');
    const newMessageRef = useRef('');
    const [messages, setMessages] = useState<SocketMessageType[]>(props.initialMessages ?? []);
    const [sendingLoading, setSendingLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (props.initialMessages) setMessages(props.initialMessages);
    }, [props.initialMessages]);

    useEffect(() => {
        socket?.on('newMessage', (res) => {
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

    function sendMessageHandler() {
        setSendingLoading(true);
        if (id) {
            socket?.emit('sendMessage', { groupId: id, message: newMessage });
        }
    }

    return (
        <Card
            title="Chat"
            className="ml-4 flex h-full !w-auto max-w-[326px] flex-2 flex-col overflow-hidden max-md:hidden"
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
    );
};

export default GroupChatDesktop;
