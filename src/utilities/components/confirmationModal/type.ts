export interface ConfirmationModalProps {
    onClose: () => void;
    isOpen: boolean;
    onConfirm: () => Promise<void> | void;
    submitButtonText?: string;
    cancelButtonText?: string;
    description: string;
    title?: string;
}
