import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, FormHelperText, SelectChangeEvent } from '@mui/material';

interface SelectOption {
  value: string;
  label: string;
}

export interface CustomSelectProps {
  name: string;
  label: string;
  value: string;
  options: SelectOption[];
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  helperText?: string;
  onChange: (value: string) => void;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  name,
  label,
  value,
  options,
  required = false,
  disabled = false,
  fullWidth = false,
  helperText,
  onChange,
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value);
  };

  return (
    <FormControl
      variant="outlined"
      required={required}
      disabled={disabled}
      fullWidth={fullWidth}
    >
      <InputLabel>{label}</InputLabel>
      <Select
        name={name}
        value={value}
        label={label}
        onChange={handleChange}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {helperText && (
        <FormHelperText>{helperText}</FormHelperText>
      )}
    </FormControl>
  );
};

export default CustomSelect; 