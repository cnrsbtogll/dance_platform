import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';

interface AgeInputProps extends Omit<TextFieldProps, 'onChange'> {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  error?: boolean;
  helperText?: string;
  label?: string;
  required?: boolean;
}

const AgeInput: React.FC<AgeInputProps> = ({
  value,
  onChange,
  error,
  helperText,
  label = "Yaş",
  required = false,
  ...props
}) => {
  const [localValue, setLocalValue] = React.useState<string>(value?.toString() || '');

  React.useEffect(() => {
    setLocalValue(value?.toString() || '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Sadece sayısal değer kontrolü ve 2 basamak limiti
    if (!/^\d*$/.test(inputValue) || inputValue.length > 2) {
      return;
    }

    setLocalValue(inputValue);

    // Boş input kontrolü
    if (!inputValue) {
      onChange(undefined);
      return;
    }

    const numValue = parseInt(inputValue, 10);
    onChange(numValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Sayısal tuşlar (0-9)
    const isNumericKey = /^[0-9]$/.test(e.key);
    // Özel tuşlar (backspace, delete, arrow keys, tab)
    const isSpecialKey = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key);
    
    // 2 basamak kontrolü - seçili metin varsa izin ver
    const hasSelection = 
      e.currentTarget.selectionStart !== e.currentTarget.selectionEnd;
    const willExceedLimit = 
      localValue.length >= 2 && isNumericKey && !hasSelection;
    
    if (!isNumericKey && !isSpecialKey) {
      e.preventDefault();
    }

    if (willExceedLimit) {
      e.preventDefault();
    }
  };

  const handleBlur = () => {
    const numValue = localValue ? parseInt(localValue, 10) : undefined;

    if (numValue !== undefined) {
      if (numValue < 16) {
        onChange(16);
        setLocalValue('16');
      } else if (numValue > 99) {
        onChange(99);
        setLocalValue('99');
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    if (/^\d{1,2}$/.test(pastedText)) {
      const numValue = parseInt(pastedText, 10);
      if (numValue >= 0 && numValue <= 99) {
        setLocalValue(pastedText);
        onChange(numValue);
      }
    }
  };

  return (
    <TextField
      {...props}
      type="text"
      value={localValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onPaste={handlePaste}
      error={error}
      helperText={helperText || (error ? 'Yaş 16 ile 99 arasında olmalıdır' : '')}
      label={label}
      required={required}
      inputProps={{
        inputMode: 'numeric',
        pattern: '[0-9]*',
        maxLength: 2,
        style: { textAlign: 'left' }
      }}
      fullWidth
    />
  );
};

export default AgeInput; 