/**
 * İsimden baş harfleri alır ve avatar oluşturur
 * @param name Kişi veya kurum adı
 * @param userType Kullanıcı türü (öğrenci, eğitmen, okul)
 * @returns Avatar URL'i
 */
export const generateInitialsAvatar = (name: string, userType: 'student' | 'instructor' | 'school' = 'student'): string => {
  // Boş veya undefined isim kontrolü
  if (!name) {
    return `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#6366f1"/><text x="50" y="50" font-family="Arial" font-size="35" fill="white" text-anchor="middle" dy=".3em">?</text></svg>')}`;
  }

  // İsimden baş harfleri al (en fazla 2 harf)
  const initials = name
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toLocaleUpperCase('tr-TR'))
    .slice(0, 2)
    .join('');

  // Kullanıcı tipine göre renk seç
  const colors = {
    student: ['#6366f1', '#8b5cf6'], // indigo to purple
    instructor: ['#f59e0b', '#ea580c'], // amber to orange
    school: ['#059669', '#0891b2'] // emerald to cyan
  };

  const [startColor, endColor] = colors[userType];

  // SVG oluştur
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${startColor};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${endColor};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" fill="url(#grad)"/>
    <text x="50" y="50" font-family="Arial" font-size="${initials.length > 1 ? '35' : '40'}" fill="white" text-anchor="middle" dy=".3em">${initials}</text>
  </svg>`;

  // SVG'yi base64'e çevir (UTF-8 karakterleri destekleyecek şekilde)
  const encodedSvg = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${encodedSvg}`;
}; 