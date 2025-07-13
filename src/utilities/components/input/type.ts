import { SxProps, Theme } from '@mui/material/styles';
import { CSSProperties, ReactNode, Ref } from 'react';
import { IconType } from 'react-icons/lib';

export interface InputProps {
    size?: 'small' | 'medium';
    name?: string;
    label: string;
    variant?: 'outlined' | 'filled' | 'standard';
    type?: string;
    autoComplete?: string;
    required?: boolean;
    value?: string;
    onChange: (e: string) => void;
    error?: boolean;
    helperText?: string;
    onEnter?: () => void;
    className?: string;
    style?: CSSProperties;
    sx?: SxProps<Theme>;
    ref?: Ref<HTMLInputElement>;
    startIcon?: ReactNode;
    endIcon?: ReactNode;
    isFocus?: boolean;
}
