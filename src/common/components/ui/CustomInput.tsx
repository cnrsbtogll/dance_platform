import React from 'react';
import { TextField, Checkbox, FormControlLabel, FormHelperText } from '@mui/material';

export interface CustomInputProps {
  type?: 'text' | 'email' | 'password' | 'checkbox';
  name: string;
  label: string;
  value?: string;
  checked?: boolean;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  minLength?: number;
  helperText?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  type = 'text',
  name,
  label,
  value,
  checked,
  required = false,
  disabled = false,
  fullWidth = false,
  minLength,
  helperText,
  onChange,
}) => {
  if (type === 'checkbox') {
    return (
      <div>
        <FormControlLabel
          control={
            <Checkbox
              name={name}
              checked={checked}
              onChange={onChange}
              disabled={disabled}
            />
          }
          label={label}
        />
        {helperText && (
          <FormHelperText>{helperText}</FormHelperText>
        )}
      </div>
    );
  }

  return (
    <TextField
      type={type}
      name={name}
      label={label}
      value={value}
      required={required}
      disabled={disabled}
      fullWidth={fullWidth}
      inputProps={{ minLength }}
      helperText={helperText}
      onChange={onChange}
      variant="outlined"
    />
  );
};

export default CustomInput; 