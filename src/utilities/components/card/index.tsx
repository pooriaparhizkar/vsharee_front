import { useContext, useEffect } from 'react';
import { CardProps } from './type';
import { SocketContext } from 'context/SocketContext';

const Card: React.FC<CardProps> = (props: CardProps) => {
    return (
        <div
            onClick={props.onClick}
            style={props.style}
            className={`bg-background/50 flex w-full flex-col rounded-xl border border-white/10 p-4 shadow-lg backdrop-blur-2xl ${props.className ?? ''}`}
        >
            {props.title && (
                <div className="flex items-center">
                    <h1 className="text-primary-100 text-xl font-bold">{props.title}</h1>
                    <span className="flex-1" />
                    {props.extra && props.extra}
                </div>
            )}
            <div className={`flex flex-1 flex-col overflow-hidden ${props.title ? 'pt-4' : ''}`} style={props.style}>
                {props.children}
            </div>
        </div>
    );
};

export default Card;
