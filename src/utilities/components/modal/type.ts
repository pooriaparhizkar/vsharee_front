import { ReactNode } from 'react';

export interface ModalProps {
    children: ReactNode;
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    width?: number;
}
