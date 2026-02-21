// ── Nepal Province → District mapping (all 7 provinces, 77 districts) ──

export const PROVINCES = [
  {
    id: 1,
    name: 'Koshi',
    nameNe: 'कोशी',
    districts: [
      'Taplejung', 'Panchthar', 'Ilam', 'Jhapa', 'Morang', 'Sunsari',
      'Dhankuta', 'Terhathum', 'Sankhuwasabha', 'Bhojpur', 'Solukhumbu',
      'Okhaldhunga', 'Khotang', 'Udayapur',
    ],
    districtsNe: [
      'ताप्लेजुङ', 'पाँचथर', 'इलाम', 'झापा', 'मोरङ', 'सुनसरी',
      'धनकुटा', 'तेह्रथुम', 'सङ्खुवासभा', 'भोजपुर', 'सोलुखुम्बु',
      'ओखलढुङ्गा', 'खोटाङ', 'उदयपुर',
    ],
  },
  {
    id: 2,
    name: 'Madhesh',
    nameNe: 'मधेश',
    districts: [
      'Saptari', 'Siraha', 'Dhanusha', 'Mahottari',
      'Sarlahi', 'Rautahat', 'Bara', 'Parsa',
    ],
    districtsNe: [
      'सप्तरी', 'सिराहा', 'धनुषा', 'महोत्तरी',
      'सर्लाही', 'रौतहट', 'बारा', 'पर्सा',
    ],
  },
  {
    id: 3,
    name: 'Bagmati',
    nameNe: 'बागमती',
    districts: [
      'Dolakha', 'Sindhupalchok', 'Rasuwa', 'Dhading', 'Nuwakot',
      'Kathmandu', 'Bhaktapur', 'Lalitpur', 'Kavrepalanchok',
      'Ramechhap', 'Sindhuli', 'Makwanpur', 'Chitwan',
    ],
    districtsNe: [
      'दोलखा', 'सिन्धुपाल्चोक', 'रसुवा', 'धादिङ', 'नुवाकोट',
      'काठमाडौँ', 'भक्तपुर', 'ललितपुर', 'काभ्रेपलाञ्चोक',
      'रामेछाप', 'सिन्धुली', 'मकवानपुर', 'चितवन',
    ],
  },
  {
    id: 4,
    name: 'Gandaki',
    nameNe: 'गण्डकी',
    districts: [
      'Gorkha', 'Lamjung', 'Tanahun', 'Syangja', 'Kaski',
      'Manang', 'Mustang', 'Myagdi', 'Parbat', 'Baglung',
      'Nawalparasi East',
    ],
    districtsNe: [
      'गोरखा', 'लमजुङ', 'तनहुँ', 'स्याङ्जा', 'कास्की',
      'मनाङ', 'मुस्ताङ', 'म्याग्दी', 'पर्वत', 'बाग्लुङ',
      'नवलपरासी पूर्व',
    ],
  },
  {
    id: 5,
    name: 'Lumbini',
    nameNe: 'लुम्बिनी',
    districts: [
      'Rukum East', 'Rolpa', 'Pyuthan', 'Gulmi', 'Arghakhanchi',
      'Palpa', 'Nawalparasi West', 'Rupandehi', 'Kapilvastu',
      'Dang', 'Banke', 'Bardiya',
    ],
    districtsNe: [
      'रुकुम पूर्व', 'रोल्पा', 'प्युठान', 'गुल्मी', 'अर्घाखाँची',
      'पाल्पा', 'नवलपरासी पश्चिम', 'रुपन्देही', 'कपिलवस्तु',
      'दाङ', 'बाँके', 'बर्दिया',
    ],
  },
  {
    id: 6,
    name: 'Karnali',
    nameNe: 'कर्णाली',
    districts: [
      'Dolpa', 'Mugu', 'Humla', 'Jumla', 'Kalikot',
      'Dailekh', 'Jajarkot', 'Rukum West', 'Salyan', 'Surkhet',
    ],
    districtsNe: [
      'डोल्पा', 'मुगु', 'हुम्ला', 'जुम्ला', 'कालिकोट',
      'दैलेख', 'जाजरकोट', 'रुकुम पश्चिम', 'सल्यान', 'सुर्खेत',
    ],
  },
  {
    id: 7,
    name: 'Sudurpashchim',
    nameNe: 'सुदूरपश्चिम',
    districts: [
      'Bajura', 'Bajhang', 'Darchula', 'Baitadi', 'Dadeldhura',
      'Doti', 'Achham', 'Kailali', 'Kanchanpur',
    ],
    districtsNe: [
      'बाजुरा', 'बझाङ', 'दार्चुला', 'बैतडी', 'डडेल्धुरा',
      'डोटी', 'अछाम', 'कैलाली', 'कञ्चनपुर',
    ],
  },
];

export const SECTORS = [
  { value: 'Road', label: 'Road', labelNe: 'सडक' },
  { value: 'Bridge', label: 'Bridge', labelNe: 'पुल' },
  { value: 'Education', label: 'Education', labelNe: 'शिक्षा' },
  { value: 'Healthcare', label: 'Healthcare', labelNe: 'स्वास्थ्य' },
  { value: 'WaterSupply', label: 'Water Supply', labelNe: 'खानेपानी' },
  { value: 'Irrigation', label: 'Irrigation', labelNe: 'सिँचाइ' },
  { value: 'Energy', label: 'Energy', labelNe: 'ऊर्जा' },
  { value: 'Building', label: 'Building', labelNe: 'भवन' },
  { value: 'Sanitation', label: 'Sanitation', labelNe: 'सरसफाई' },
  { value: 'Telecom', label: 'Telecommunication', labelNe: 'दूरसञ्चार' },
];

/**
 * Get districts for a given province name.
 * @param {string} provinceName
 * @param {'en'|'ne'} lang
 * @returns {string[]}
 */
export function getDistrictsForProvince(provinceName, lang = 'en') {
  const prov = PROVINCES.find(
    (p) => p.name === provinceName || p.nameNe === provinceName
  );
  if (!prov) return [];
  return lang === 'ne' ? prov.districtsNe : prov.districts;
}

/**
 * Get province display name.
 */
export function getProvinceName(province, lang = 'en') {
  return lang === 'ne' ? province.nameNe : province.name;
}
