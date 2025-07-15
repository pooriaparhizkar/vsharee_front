import { CardProps } from './type';

const Card: React.FC<CardProps> = (props: CardProps) => {
    return (
        <div
            style={props.style}
            className={`bg-background/50 flex w-full flex-col rounded-xl border border-white/10 p-6 shadow-lg backdrop-blur-2xl ${props.className}`}
        >
            {props.title && (
                <div className="mb-6 flex items-center">
                    <h1 className="text-primary-100 text-2xl font-bold">{props.title}</h1>
                    <span className="flex-1" />
                    {props.extra && props.extra}
                </div>
            )}
            <div className="flex-1" style={props.style}>
                {props.children}
            </div>
        </div>
    );
};

export default Card;
