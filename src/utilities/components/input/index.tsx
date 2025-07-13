import React, { forwardRef } from 'react';
import TextField from '@mui/material/TextField';
import { _emailValidation, _passwordValidation } from '@/scripts/validations';
import { InputProps } from './type';
import InputAdornment from '@mui/material/InputAdornment';

const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && props.onEnter) {
            props.onEnter();
        }
    };

    return (
        <TextField
            focused={props.isFocus}
            inputRef={ref}
            className={props.className}
            style={props.style}
            fullWidth
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
            sx={props.sx}
            slotProps={{
                input: {
                    startAdornment: props.startIcon && (
                        <InputAdornment position="start">{props.startIcon}</InputAdornment>
                    ),
                    endAdornment: props.endIcon && <InputAdornment position="start">{props.endIcon}</InputAdornment>,
                },
            }}
        />
    );
});

export default Input;
