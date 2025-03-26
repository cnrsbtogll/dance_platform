/**
 * İsimden baş harfleri alır ve avatar oluşturur
 * @param name Kişi veya kurum adı
 * @returns Avatar URL'i
 */
export const generateInitialsAvatar = (name: string): string => {
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

  // Rastgele bir renk seç
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  // SVG oluştur
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="${color}"/>
    <text x="50" y="50" font-family="Arial" font-size="${initials.length > 1 ? '35' : '40'}" fill="white" text-anchor="middle" dy=".3em">${initials}</text>
  </svg>`;

  // SVG'yi base64'e çevir (UTF-8 karakterleri destekleyecek şekilde)
  const encodedSvg = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${encodedSvg}`;
}; 