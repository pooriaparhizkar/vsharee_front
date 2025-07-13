import { CardProps } from './type';

const Card: React.FC<CardProps> = (props: CardProps) => {
    return (
        <div
            style={props.style}
            className={`flex w-full flex-col rounded-xl border border-white/10 bg-black/30 p-6 shadow-lg backdrop-blur-2xl ${props.className}`}
        >
            {props.title && <h1 className="text-primary-100 !mb-6 text-2xl font-bold">{props.title}</h1>}
            <div className="flex-1" style={props.style}>
                {props.children}
            </div>
        </div>
    );
};

export default Card;
