import React from 'react';
import { TextField } from '@mui/material';

export interface CustomPhoneInputProps {
  name: string;
  label: string;
  value: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  helperText?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const CustomPhoneInput: React.FC<CustomPhoneInputProps> = ({
  name,
  label,
  value,
  required = false,
  disabled = false,
  fullWidth = false,
  helperText,
  onChange,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Only allow digits, spaces, parentheses, and hyphens
    const sanitizedValue = e.target.value.replace(/[^\d\s()-]/g, '');
    
    // Update the input with the sanitized value
    const event = {
      ...e,
      target: {
        ...e.target,
        name,
        value: sanitizedValue,
      },
    };
    
    onChange(event);
  };

  return (
    <TextField
      type="tel"
      name={name}
      label={label}
      value={value}
      required={required}
      disabled={disabled}
      fullWidth={fullWidth}
      helperText={helperText}
      onChange={handleChange}
      variant="outlined"
      inputProps={{
        pattern: '[0-9\\s()-]*',
        maxLength: 15,
      }}
    />
  );
};

export default CustomPhoneInput; 