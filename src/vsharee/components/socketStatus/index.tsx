import { useContext, useEffect, useState } from 'react';
import { SocketContext } from '@/context/SocketContext';

const SocketStatus: React.FC = () => {
    const socket = useContext(SocketContext);

    const [heartbeatStatus, setHeartbeatStatus] = useState<'green' | 'orange' | 'red' | 'gray'>('green');
    const [pulse, setPulse] = useState(false);

    useEffect(() => {
        let lastAck = Date.now();

        const interval = setInterval(() => {
            socket?.emit('heartbeat');

            const diff = Date.now() - lastAck;
            if (diff > 10 * 60 * 1000) {
                setHeartbeatStatus('gray');
            } else if (diff > 2 * 60 * 1000) {
                setHeartbeatStatus('red');
            } else if (diff > 30 * 1000) {
                setHeartbeatStatus('orange');
            }
        }, 5000); // ping every 5 seconds

        const handleAck = () => {
            lastAck = Date.now();
            setHeartbeatStatus('green');
            setPulse(true);
            setTimeout(() => setPulse(false), 300); // breathing animation duration
        };

        socket?.on('heartbeat_ack', handleAck);

        return () => {
            clearInterval(interval);
            socket?.off('heartbeat_ack', handleAck);
        };
    }, []);

    return (
        <span
            className={`inline-block h-2 max-h-2 min-h-2 w-2 max-w-2 min-w-2 rounded-full transition-all duration-300 ${
                heartbeatStatus === 'green'
                    ? 'bg-green-500'
                    : heartbeatStatus === 'orange'
                      ? 'bg-orange-400'
                      : heartbeatStatus === 'gray'
                        ? 'bg-gray-500'
                        : 'bg-red-500'
            } ${pulse ? 'scale-150' : 'scale-100'}`}
        ></span>
    );
};

export default SocketStatus;
