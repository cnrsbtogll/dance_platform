export const generateInitialsAvatar = (name: string, type: 'school' | 'instructor' | 'student' = 'school'): string => {
  // İsmin baş harfini al
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  
  // Tip bazlı renk belirleme
  let backgroundColor;
  let textColor = '#FFFFFF'; // Beyaz metin
  
  switch(type) {
    case 'school':
      backgroundColor = '#8B5CF6'; // Mor - okullar için
      break;
    case 'instructor':
      backgroundColor = '#3B82F6'; // Mavi - eğitmenler için
      break;
    case 'student':
      backgroundColor = '#10B981'; // Yeşil - öğrenciler için
      break;
    default:
      backgroundColor = '#6B7280'; // Gri - varsayılan
  }
  
  // SVG avatar oluştur
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="${backgroundColor}"/>
      <text 
        x="50%" 
        y="50%" 
        dy=".1em" 
        font-family="Arial, sans-serif" 
        font-size="100" 
        fill="${textColor}" 
        text-anchor="middle" 
        dominant-baseline="middle"
      >
        ${initial}
      </text>
    </svg>
  `;
  
  // SVG'yi base64 formatına dönüştür
  return `data:image/svg+xml;base64,${btoa(svgContent)}`;
}; 