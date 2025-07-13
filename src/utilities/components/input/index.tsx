import React from 'react';
import TextField from '@mui/material/TextField';
import { _emailValidation, _passwordValidation } from '@/scripts/validations';
import { InputProps } from './type';

const Input: React.FC<InputProps> = (props: InputProps) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && props.onEnter) {
            props.onEnter();
        }
    };

    return (
        <TextField
            size={props.size || 'small'}
            name={props.name}
            label={props.label}
            variant={props.variant || 'outlined'}
            type={props.type || 'text'}
            autoComplete={props.autoComplete || 'off'}
            required={props.required || false}
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            error={props.error || false}
            helperText={props.helperText || ''}
        />
    );
};

export default Input;
