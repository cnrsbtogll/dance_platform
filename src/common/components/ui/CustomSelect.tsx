import React, { Fragment } from 'react';
  
import { Listbox, Transition } from '@headlessui/react';

interface CustomSelectProps {
  label: string;
  options: Array<{ label: string; value: string } | string>;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  className?: string;
  error?: string; // Hata mesajı için prop
  multiple?: boolean; // Çoklu seçim için
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Seçiniz",
  className = "",
  error,
  multiple = false
}) => {
  // String ve obje tipindeki seçenekleri tutarlı hale getir
  const formattedOptions = options.map(option => 
    typeof option === 'string' ? { label: option, value: option } : option
  );

  // Seçili değerlerin label'larını bul
  let selectedLabel = placeholder;
  
  if (multiple && Array.isArray(value) && value.length > 0) {
    // Çoklu seçim durumunda, seçili değerlerin etiketlerini birleştir
    const selectedLabels = value.map(val => 
      formattedOptions.find(opt => opt.value === val)?.label || val
    );
    if (selectedLabels.length === 1) {
      selectedLabel = selectedLabels[0];
    } else if (value.length === formattedOptions.length) {
      selectedLabel = "Tümü seçildi";
    } else {
      selectedLabel = `${selectedLabels.length} öğe seçildi`;
    }
  } else if (!multiple && typeof value === 'string' && value) {
    // Tekli seçim durumunda
    selectedLabel = formattedOptions.find(opt => opt.value === value)?.label || placeholder;
  }

  // Value'nun doğru formatta olduğundan emin ol
  const safeValue = multiple && !Array.isArray(value) ? [] : value;

  // onChange handlerı için güvenli seçim işleme
  const handleChange = (newValue: string | string[]) => {
    // Çoklu seçim olup olmadığını kontrol et
    if (multiple) {
      // Tek bir değer seçildiğinde dizi formuna dönüştür
      if (!Array.isArray(newValue)) {
        onChange([newValue]);
      } else {
        onChange(newValue);
      }
    } else {
      // Tekli seçim için dizi seçildiğinde ilk elemanı al
      if (Array.isArray(newValue) && newValue.length > 0) {
        onChange(newValue[0]);
      } else if (typeof newValue === 'string') {
        onChange(newValue);
      }
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <Listbox value={safeValue} onChange={handleChange} multiple={multiple}>
        {({ open }) => (
          <>
            <Listbox.Label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </Listbox.Label>
            <div className="relative mt-1">
              <Listbox.Button className={`relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left border ${error ? 'border-red-500' : 'border-gray-300'} focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500`}>
                <span className="block truncate">{selectedLabel}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clipRule="evenodd" />
                  </svg>
                </span>
              </Listbox.Button>
              <Transition
                show={open}
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {multiple && (
                    <div className="px-3 py-2 border-b border-gray-200">
                      <span className="text-xs font-medium text-gray-500">
                        Birden fazla seçim yapabilirsiniz
                      </span>
                    </div>
                  )}
                  {multiple && (
                    <div 
                      className="relative cursor-default select-none py-2 pl-10 pr-4 hover:bg-indigo-100 hover:text-indigo-900"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation(); // Seçim menüsünün kapanmasını önle
                        // Tümünü seç veya kaldır
                        if (Array.isArray(safeValue) && safeValue.length === formattedOptions.length) {
                          // Tüm seçimler yapılmışsa, hepsini kaldır
                          handleChange([]);
                        } else {
                          // Değilse, tümünü seç
                          handleChange(formattedOptions.map(opt => opt.value));
                        }
                      }}
                    >
                      <span className="block truncate font-medium">
                        Tümünü Seç/Kaldır
                      </span>
                      {Array.isArray(safeValue) && formattedOptions.length > 0 && safeValue.length === formattedOptions.length ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                        </span>
                      ) : null}
                    </div>
                  )}
                  {formattedOptions.map((option) => (
                    <Listbox.Option
                      key={option.value}
                      value={option.value}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'
                        }`
                      }
                    >
                      {({ selected, active }) => {
                    // Çoklu seçim için doğru kontrol yap
                    const isSelected = multiple 
                      ? Array.isArray(value) && value.includes(option.value)
                      : selected;
                      
                    return (
                      <>
                        <span className={`block truncate ${isSelected ? 'font-medium' : 'font-normal'}`}>
                          {option.label}
                        </span>
                        {isSelected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                          </span>
                        ) : null}
                      </>
                    );
                  }}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
            {error && (
              <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
          </>
        )}
      </Listbox>
    </div>
  );
};

export default CustomSelect; 