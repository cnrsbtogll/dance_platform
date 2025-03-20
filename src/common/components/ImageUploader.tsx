import React, { useState, useRef, useEffect } from 'react';

interface ImageUploaderProps {
  currentPhotoURL: string;
  onImageChange: (base64Image: string | null) => void;
  shape?: 'circle' | 'square';
  width?: number;
  height?: number;
  title?: string;
  resetState?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentPhotoURL,
  onImageChange,
  shape = 'square',
  width = 200,
  height = 200,
  title = 'Fotoğraf Yükle',
  resetState = false
}) => {
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (resetState) {
      setPreviewURL(null);
      setIsEditing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [resetState]);

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 200;  // Reduced from 400
          const MAX_HEIGHT = 200; // Reduced from 400
          
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Daha düşük JPEG kalitesi (0.4'ten 0.2'ye)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.2);
          
          // Base64 header'ı kaldır ve tekrar ekle (optimize etmek için)
          const base64Data = compressedBase64.split(',')[1];
          const optimizedBase64 = `data:image/jpeg;base64,${base64Data}`;
          
          resolve(optimizedBase64);
        };
        
        img.onerror = (error) => {
          reject(error);
        };
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        setPreviewURL(compressedBase64);
        setIsEditing(true);
      } catch (error) {
        console.error('Error compressing image:', error);
        // Sıkıştırma başarısız olursa normal yöntemi dene
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewURL(reader.result as string);
          setIsEditing(true);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleConfirm = () => {
    if (previewURL) {
      onImageChange(previewURL);
      setPreviewURL(null);
      setIsEditing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCancel = () => {
    setPreviewURL(null);
    setIsEditing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative group cursor-pointer ${
          shape === 'circle' ? 'rounded-full' : 'rounded-lg'
        }`}
        style={{ width: `${width}px`, height: `${height}px` }}
        onClick={handleClick}
      >
        <img
          src={previewURL || currentPhotoURL || '/default-avatar.png'}
          alt="Profile"
          className={`w-full h-full object-cover ${
            shape === 'circle' ? 'rounded-full' : 'rounded-lg'
          }`}
        />
        <div
          className={`absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${
            shape === 'circle' ? 'rounded-full' : 'rounded-lg'
          }`}
        >
          <span className="text-white text-sm">{isEditing ? 'Fotoğrafı Değiştir' : title}</span>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {isEditing && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleConfirm}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
          >
            Onayla
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
          >
            İptal
          </button>
        </div>
      )}
    </div>
  );
}; 