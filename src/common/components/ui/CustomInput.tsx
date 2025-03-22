import { ChangeEvent } from 'react';
import { TextField } from '@mui/material';

export interface CustomInputProps {
  name: string;
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement> | { target: { name: string; value: any } }) => void;
  type?: 'text' | 'email' | 'password' | 'checkbox';
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  name,
  label,
  value,
  onChange,
  type = 'text',
  error = false,
  helperText,
  fullWidth = true,
  multiline = false,
  rows,
  placeholder,
}) => {
  return (
    <TextField
      name={name}
      label={label}
      value={value}
      onChange={onChange}
      type={type}
      error={error}
      helperText={helperText}
      fullWidth={fullWidth}
      multiline={multiline}
      rows={rows}
      placeholder={placeholder}
      variant="outlined"
      size="small"
    />
  );
};

export default CustomInput; 