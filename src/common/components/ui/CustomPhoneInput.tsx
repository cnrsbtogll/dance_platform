import React, { useState, useEffect } from 'react';

interface CustomPhoneInputProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onValidation?: (isValid: boolean, errorMessage?: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
  className?: string;
  disabled?: boolean;
}

const CustomPhoneInput: React.FC<CustomPhoneInputProps> = ({
  id,
  name,
  value,
  onChange,
  onValidation,
  label,
  required = false,
  error,
  className = "",
  disabled = false
}) => {
  const validatePhoneNumber = (phoneNumber: string): { isValid: boolean; errorMessage?: string } => {
    // Boş kontrolü
    if (required && !phoneNumber) {
      return { isValid: false, errorMessage: 'Bu alan zorunlu' };
    }

    // Telefon numarasının kontrolü - boşlukları kaldır ve doğrula
    const cleanPhone = phoneNumber.replace(/\s/g, '');
    
    if (cleanPhone && cleanPhone.length !== 10) {
      return { isValid: false, errorMessage: '10 rakam girmelisiniz' };
    }

    return { isValid: true };
  };

  const formatPhoneNumber = (inputValue: string): string => {
    // Sadece rakam girişine izin ver
    const rawValue = inputValue.replace(/[^0-9]/g, '');
    
    // 10 karakterden uzun olmasını engelleyin
    const trimmedValue = rawValue.slice(0, 10);
    
    // Telefon numarasına maske uygula (XXX XXX XX XX formatında)
    let formattedValue = trimmedValue;
    
    if (trimmedValue.length > 3) {
      formattedValue = `${trimmedValue.slice(0, 3)} ${trimmedValue.slice(3)}`;
    }
    if (trimmedValue.length > 6) {
      formattedValue = `${formattedValue.slice(0, 7)} ${formattedValue.slice(7)}`;
    }
    if (trimmedValue.length > 8) {
      formattedValue = `${formattedValue.slice(0, 10)} ${formattedValue.slice(10)}`;
    }
    
    return formattedValue;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    
    // Validate the formatted value
    const validation = validatePhoneNumber(formattedValue);
    if (onValidation) {
      onValidation(validation.isValid, validation.errorMessage);
    }
    
    // Create a new event with the formatted value
    const newEvent = {
      ...e,
      target: {
        ...e.target,
        name: e.target.name,
        value: formattedValue
      }
    };
    
    onChange(newEvent);
  };

  // Initial validation on mount and value change
  useEffect(() => {
    if (onValidation) {
      const validation = validatePhoneNumber(value);
      onValidation(validation.isValid, validation.errorMessage);
    }
  }, [value, onValidation]);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="flex items-center">
        <div className={`bg-gray-100 p-2 border ${error ? 'border-red-500' : 'border-gray-300'} border-r-0 rounded-l-md`}>
          +90
        </div>
        <input
          type="tel"
          id={id}
          name={name}
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          placeholder="XXX XXX XX XX"
          inputMode="numeric"
          className={`w-full p-2 border ${error ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 ${className}`}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default CustomPhoneInput; 