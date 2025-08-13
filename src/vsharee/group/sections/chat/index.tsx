import { useEffect, useState } from 'react';
import { get } from '@/scripts';
import { useParams } from 'react-router-dom';
import { MessageType, Pagination, SocketMessageType } from '@/interfaces';
import { API } from '@/data';
import GroupChatMobile from './mobile';
import GroupChatDesktop from './desktop';

const GroupChatCard: React.FC = () => {
    const isMobile = useIsMobile();
    const { id } = useParams();
    const [initialMessages, setInitialMessages] = useState<SocketMessageType[]>();

    useEffect(() => {
        fetchInitialMessages();
    }, []);

    function fetchInitialMessages() {
        if (id) {
            get<Pagination<MessageType>>(API.group.messages(id, 1, 100))
                .then((res) =>
                    setInitialMessages(res.value.value.data.map((item) => ({ message: item.text, user: item.sender }))),
                )
                .catch((err) => setInitialMessages([]));
        }
    }

    function useIsMobile(breakpoint = 768) {
        const [isMobile, setIsMobile] = useState(false);

        useEffect(() => {
            const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
            setIsMobile(mediaQuery.matches);

            const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
            mediaQuery.addEventListener('change', handler);

            return () => mediaQuery.removeEventListener('change', handler);
        }, [breakpoint]);

        return isMobile;
    }

    if (isMobile) return <GroupChatMobile initialMessages={initialMessages} />;
    return <GroupChatDesktop initialMessages={initialMessages} />;
};

export default GroupChatCard;
