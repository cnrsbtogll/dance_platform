import React from 'react';
import CustomSelect from './CustomSelect';

interface AvailableTimesSelectProps {
  value: string[];
  onChange: (times: string[]) => void;
  error?: string;
  required?: boolean;
}

const timeSlots = [
  { value: 'morning', label: 'Sabah (08:00-12:00)' },
  { value: 'afternoon', label: 'Öğleden Sonra (12:00-17:00)' },
  { value: 'evening', label: 'Akşam (17:00-21:00)' },
  { value: 'night', label: 'Gece (21:00-00:00)' },
  { value: 'weekends', label: 'Hafta Sonu' }
];

const AvailableTimesSelect: React.FC<AvailableTimesSelectProps> = ({
  value,
  onChange,
  error,
  required = false
}) => {
  return (
    <CustomSelect
      name="availableTimes"
      label="Uygun Zamanlar"
      value={value}
      onChange={(newValue) => onChange(newValue as string[])}
      options={timeSlots}
      multiple
      required={required}
      error={error}
      placeholder="Uygun zamanlarınızı seçin"
    />
  );
};

export default AvailableTimesSelect; 