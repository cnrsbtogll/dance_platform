import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  label: string;
  name: string;
  value: string | string[];
  options: Option[];
  onChange: (value: string | string[]) => void;
  error?: string;
  multiple?: boolean;
  required?: boolean;
  placeholder?: string;
  fullWidth?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  name,
  value,
  options,
  onChange,
  error,
  multiple = false,
  required = false,
  placeholder,
  fullWidth = true,
}) => {
  const handleChange = (event: any) => {
    const selectedValue = event.target.value;
    onChange(selectedValue);
  };

  return (
    <FormControl fullWidth={fullWidth} error={!!error} required={required}>
      <InputLabel id={`${name}-label`}>{label}</InputLabel>
      <Select
        labelId={`${name}-label`}
        id={name}
        name={name}
        value={value}
        label={label}
        onChange={handleChange}
        multiple={multiple}
        displayEmpty={!!placeholder}
      >
        {placeholder && (
          <MenuItem value="" disabled>
            {placeholder}
          </MenuItem>
        )}
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
};

export default CustomSelect; 