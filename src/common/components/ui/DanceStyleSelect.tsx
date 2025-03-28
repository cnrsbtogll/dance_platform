import React, { useEffect, useState } from 'react';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import CustomSelect from './CustomSelect';
import { DanceStyle } from '../../../types';

// Global cache for dance styles
let cachedDanceStyles: { value: string; label: string }[] | null = null;

interface DanceStyleSelectProps {
  value: DanceStyle[];
  onChange: (styles: DanceStyle[]) => void;
  error?: string;
  required?: boolean;
}

const DanceStyleSelect: React.FC<DanceStyleSelectProps> = ({
  value,
  onChange,
  error,
  required = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const fetchDanceStyles = async () => {
      if (cachedDanceStyles) {
        setOptions(cachedDanceStyles);
        return;
      }

      setIsLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'danceStyles'));
        const styles = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          return {
            value: data.value || doc.id,
            label: data.label || data.value || doc.id
          };
        });
        
        cachedDanceStyles = styles;
        setOptions(styles);
      } catch (error) {
        console.error('Dans stilleri yüklenirken hata:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDanceStyles();
  }, []);

  return (
    <CustomSelect
      name="danceStyles"
      label="Dans Stilleri"
      value={value}
      onChange={(newValue) => onChange(newValue as DanceStyle[])}
      options={options}
      multiple
      required={required}
      error={error}
      placeholder="Dans stillerini seçin"
    />
  );
};

export default DanceStyleSelect; 