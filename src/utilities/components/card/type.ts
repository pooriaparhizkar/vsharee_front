import { CSSProperties, ReactNode } from 'react';

export interface CardProps {
    title?: string;
    className?: string;
    style?: CSSProperties;
    children: ReactNode;
    extra?: ReactNode;
}
