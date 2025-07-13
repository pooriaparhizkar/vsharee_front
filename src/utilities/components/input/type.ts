export interface InputProps {
    size?: 'small' | 'medium';
    name: string;
    label: string;
    variant?: 'outlined' | 'filled' | 'standard';
    type?: string;
    autoComplete?: string;
    required?: boolean;
    value: string;
    onChange: (e: string) => void;
    error?: boolean;
    helperText?: string;
    onEnter?: () => void;
}
