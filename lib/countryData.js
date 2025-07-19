// Country codes and phone number data
export const countries = [
  { code: 'SA', name: 'السعودية', dialCode: '+966', flag: '🇸🇦' },
  { code: 'EG', name: 'مصر', dialCode: '+20', flag: '🇪🇬' },
  { code: 'AE', name: 'الإمارات', dialCode: '+971', flag: '🇦🇪' },
  { code: 'KW', name: 'الكويت', dialCode: '+965', flag: '🇰🇼' },
  { code: 'QA', name: 'قطر', dialCode: '+974', flag: '🇶🇦' },
  { code: 'BH', name: 'البحرين', dialCode: '+973', flag: '🇧🇭' },
  { code: 'OM', name: 'عمان', dialCode: '+968', flag: '🇴🇲' },
  { code: 'JO', name: 'الأردن', dialCode: '+962', flag: '🇯🇴' },
  { code: 'LB', name: 'لبنان', dialCode: '+961', flag: '🇱🇧' },
  { code: 'SY', name: 'سوريا', dialCode: '+963', flag: '🇸🇾' },
  { code: 'IQ', name: 'العراق', dialCode: '+964', flag: '🇮🇶' },
  { code: 'PS', name: 'فلسطين', dialCode: '+970', flag: '🇵🇸' },
  { code: 'MA', name: 'المغرب', dialCode: '+212', flag: '🇲🇦' },
  { code: 'DZ', name: 'الجزائر', dialCode: '+213', flag: '🇩🇿' },
  { code: 'TN', name: 'تونس', dialCode: '+216', flag: '🇹🇳' },
  { code: 'LY', name: 'ليبيا', dialCode: '+218', flag: '🇱🇾' },
  { code: 'SD', name: 'السودان', dialCode: '+249', flag: '🇸🇩' },
  { code: 'YE', name: 'اليمن', dialCode: '+967', flag: '🇾🇪' },
  { code: 'SO', name: 'الصومال', dialCode: '+252', flag: '🇸🇴' },
  { code: 'DJ', name: 'جيبوتي', dialCode: '+253', flag: '🇩🇯' },
  { code: 'MR', name: 'موريتانيا', dialCode: '+222', flag: '🇲🇷' },
  { code: 'US', name: 'الولايات المتحدة', dialCode: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'كندا', dialCode: '+1', flag: '🇨🇦' },
  { code: 'GB', name: 'المملكة المتحدة', dialCode: '+44', flag: '🇬🇧' },
  { code: 'FR', name: 'فرنسا', dialCode: '+33', flag: '🇫🇷' },
  { code: 'DE', name: 'ألمانيا', dialCode: '+49', flag: '🇩🇪' },
  { code: 'IT', name: 'إيطاليا', dialCode: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'إسبانيا', dialCode: '+34', flag: '🇪🇸' },
  { code: 'NL', name: 'هولندا', dialCode: '+31', flag: '🇳🇱' },
  { code: 'BE', name: 'بلجيكا', dialCode: '+32', flag: '🇧🇪' },
  { code: 'CH', name: 'سويسرا', dialCode: '+41', flag: '🇨🇭' },
  { code: 'AT', name: 'النمسا', dialCode: '+43', flag: '🇦🇹' },
  { code: 'SE', name: 'السويد', dialCode: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'النرويج', dialCode: '+47', flag: '🇳🇴' },
  { code: 'DK', name: 'الدنمارك', dialCode: '+45', flag: '🇩🇰' },
  { code: 'FI', name: 'فنلندا', dialCode: '+358', flag: '🇫🇮' },
  { code: 'PL', name: 'بولندا', dialCode: '+48', flag: '🇵🇱' },
  { code: 'CZ', name: 'التشيك', dialCode: '+420', flag: '🇨🇿' },
  { code: 'HU', name: 'المجر', dialCode: '+36', flag: '🇭🇺' },
  { code: 'RO', name: 'رومانيا', dialCode: '+40', flag: '🇷🇴' },
  { code: 'BG', name: 'بلغاريا', dialCode: '+359', flag: '🇧🇬' },
  { code: 'GR', name: 'اليونان', dialCode: '+30', flag: '🇬🇷' },
  { code: 'TR', name: 'تركيا', dialCode: '+90', flag: '🇹🇷' },
  { code: 'RU', name: 'روسيا', dialCode: '+7', flag: '🇷🇺' },
  { code: 'UA', name: 'أوكرانيا', dialCode: '+380', flag: '🇺🇦' },
  { code: 'BY', name: 'بيلاروسيا', dialCode: '+375', flag: '🇧🇾' },
  { code: 'LT', name: 'ليتوانيا', dialCode: '+370', flag: '🇱🇹' },
  { code: 'LV', name: 'لاتفيا', dialCode: '+371', flag: '🇱🇻' },
  { code: 'EE', name: 'إستونيا', dialCode: '+372', flag: '🇪🇪' },
  { code: 'SK', name: 'سلوفاكيا', dialCode: '+421', flag: '🇸🇰' },
  { code: 'SI', name: 'سلوفينيا', dialCode: '+386', flag: '🇸🇮' },
  { code: 'HR', name: 'كرواتيا', dialCode: '+385', flag: '🇭🇷' },
  { code: 'BA', name: 'البوسنة والهرسك', dialCode: '+387', flag: '🇧🇦' },
  { code: 'RS', name: 'صربيا', dialCode: '+381', flag: '🇷🇸' },
  { code: 'ME', name: 'الجبل الأسود', dialCode: '+382', flag: '🇲🇪' },
  { code: 'MK', name: 'مقدونيا الشمالية', dialCode: '+389', flag: '🇲🇰' },
  { code: 'AL', name: 'ألبانيا', dialCode: '+355', flag: '🇦🇱' },
  { code: 'XK', name: 'كوسوفو', dialCode: '+383', flag: '🇽🇰' },
  { code: 'MD', name: 'مولدوفا', dialCode: '+373', flag: '🇲🇩' },
  { code: 'AM', name: 'أرمينيا', dialCode: '+374', flag: '🇦🇲' },
  { code: 'GE', name: 'جورجيا', dialCode: '+995', flag: '🇬🇪' },
  { code: 'AZ', name: 'أذربيجان', dialCode: '+994', flag: '🇦🇿' },
  { code: 'KZ', name: 'كازاخستان', dialCode: '+7', flag: '🇰🇿' },
  { code: 'UZ', name: 'أوزبكستان', dialCode: '+998', flag: '🇺🇿' },
  { code: 'TM', name: 'تركمانستان', dialCode: '+993', flag: '🇹🇲' },
  { code: 'KG', name: 'قيرغيزستان', dialCode: '+996', flag: '🇰🇬' },
  { code: 'TJ', name: 'طاجيكستان', dialCode: '+992', flag: '🇹🇯' },
  { code: 'AF', name: 'أفغانستان', dialCode: '+93', flag: '🇦🇫' },
  { code: 'IR', name: 'إيران', dialCode: '+98', flag: '🇮🇷' },
  { code: 'IL', name: 'إسرائيل', dialCode: '+972', flag: '🇮🇱' },
  { code: 'CY', name: 'قبرص', dialCode: '+357', flag: '🇨🇾' },
  { code: 'MT', name: 'مالطا', dialCode: '+356', flag: '🇲🇹' },
  { code: 'IS', name: 'آيسلندا', dialCode: '+354', flag: '🇮🇸' },
  { code: 'IE', name: 'أيرلندا', dialCode: '+353', flag: '🇮🇪' },
  { code: 'PT', name: 'البرتغال', dialCode: '+351', flag: '🇵🇹' },
  { code: 'LU', name: 'لوكسمبورغ', dialCode: '+352', flag: '🇱🇺' },
  { code: 'MC', name: 'موناكو', dialCode: '+377', flag: '🇲🇨' },
  { code: 'AD', name: 'أندورا', dialCode: '+376', flag: '🇦🇩' },
  { code: 'SM', name: 'سان مارينو', dialCode: '+378', flag: '🇸🇲' },
  { code: 'VA', name: 'الفاتيكان', dialCode: '+39', flag: '🇻🇦' },
  { code: 'LI', name: 'ليختنشتاين', dialCode: '+423', flag: '🇱🇮' },
  { code: 'MX', name: 'المكسيك', dialCode: '+52', flag: '🇲🇽' },
  { code: 'GT', name: 'غواتيمالا', dialCode: '+502', flag: '🇬🇹' },
  { code: 'BZ', name: 'بليز', dialCode: '+501', flag: '🇧🇿' },
  { code: 'SV', name: 'السلفادور', dialCode: '+503', flag: '🇸🇻' },
  { code: 'HN', name: 'هندوراس', dialCode: '+504', flag: '🇭🇳' },
  { code: 'NI', name: 'نيكاراغوا', dialCode: '+505', flag: '🇳🇮' },
  { code: 'CR', name: 'كوستاريكا', dialCode: '+506', flag: '🇨🇷' },
  { code: 'PA', name: 'بنما', dialCode: '+507', flag: '🇵🇦' },
  { code: 'CU', name: 'كوبا', dialCode: '+53', flag: '🇨🇺' },
  { code: 'JM', name: 'جامايكا', dialCode: '+1876', flag: '🇯🇲' },
  { code: 'HT', name: 'هايتي', dialCode: '+509', flag: '🇭🇹' },
  { code: 'DO', name: 'جمهورية الدومينيكان', dialCode: '+1809', flag: '🇩🇴' },
  { code: 'PR', name: 'بورتوريكو', dialCode: '+1787', flag: '🇵🇷' },
  { code: 'TT', name: 'ترينيداد وتوباغو', dialCode: '+1868', flag: '🇹🇹' },
  { code: 'BB', name: 'بربادوس', dialCode: '+1246', flag: '🇧🇧' },
  { code: 'GD', name: 'غرينادا', dialCode: '+1473', flag: '🇬🇩' },
  { code: 'LC', name: 'سانت لوسيا', dialCode: '+1758', flag: '🇱🇨' },
  { code: 'VC', name: 'سانت فنسنت والغرينادين', dialCode: '+1784', flag: '🇻🇨' },
  { code: 'AG', name: 'أنتيغوا وبربودا', dialCode: '+1268', flag: '🇦🇬' },
  { code: 'DM', name: 'دومينيكا', dialCode: '+1767', flag: '🇩🇲' },
  { code: 'KN', name: 'سانت كيتس ونيفيس', dialCode: '+1869', flag: '🇰🇳' },
  { code: 'BS', name: 'الباهاما', dialCode: '+1242', flag: '🇧🇸' },
  { code: 'BM', name: 'برمودا', dialCode: '+1441', flag: '🇧🇲' },
  { code: 'BR', name: 'البرازيل', dialCode: '+55', flag: '🇧🇷' },
  { code: 'AR', name: 'الأرجنتين', dialCode: '+54', flag: '🇦🇷' },
  { code: 'CL', name: 'تشيلي', dialCode: '+56', flag: '🇨🇱' },
  { code: 'CO', name: 'كولومبيا', dialCode: '+57', flag: '🇨🇴' },
  { code: 'VE', name: 'فنزويلا', dialCode: '+58', flag: '🇻🇪' },
  { code: 'GY', name: 'غيانا', dialCode: '+592', flag: '🇬🇾' },
  { code: 'SR', name: 'سورينام', dialCode: '+597', flag: '🇸🇷' },
  { code: 'GF', name: 'غيانا الفرنسية', dialCode: '+594', flag: '🇬🇫' },
  { code: 'UY', name: 'أوروغواي', dialCode: '+598', flag: '🇺🇾' },
  { code: 'PY', name: 'باراغواي', dialCode: '+595', flag: '🇵🇾' },
  { code: 'BO', name: 'بوليفيا', dialCode: '+591', flag: '🇧🇴' },
  { code: 'PE', name: 'بيرو', dialCode: '+51', flag: '🇵🇪' },
  { code: 'EC', name: 'الإكوادور', dialCode: '+593', flag: '🇪🇨' },
  { code: 'AU', name: 'أستراليا', dialCode: '+61', flag: '🇦🇺' },
  { code: 'NZ', name: 'نيوزيلندا', dialCode: '+64', flag: '🇳🇿' },
  { code: 'PG', name: 'بابوا غينيا الجديدة', dialCode: '+675', flag: '🇵🇬' },
  { code: 'FJ', name: 'فيجي', dialCode: '+679', flag: '🇫🇯' },
  { code: 'SB', name: 'جزر سليمان', dialCode: '+677', flag: '🇸🇧' },
  { code: 'VU', name: 'فانواتو', dialCode: '+678', flag: '🇻🇺' },
  { code: 'NC', name: 'كاليدونيا الجديدة', dialCode: '+687', flag: '🇳🇨' },
  { code: 'PF', name: 'بولينيزيا الفرنسية', dialCode: '+689', flag: '🇵🇫' },
  { code: 'WS', name: 'ساموا', dialCode: '+685', flag: '🇼🇸' },
  { code: 'TO', name: 'تونغا', dialCode: '+676', flag: '🇹🇴' },
  { code: 'KI', name: 'كيريباتي', dialCode: '+686', flag: '🇰🇮' },
  { code: 'TV', name: 'توفالو', dialCode: '+688', flag: '🇹🇻' },
  { code: 'NR', name: 'ناورو', dialCode: '+674', flag: '🇳🇷' },
  { code: 'PW', name: 'بالاو', dialCode: '+680', flag: '🇵🇼' },
  { code: 'FM', name: 'ميكرونيزيا', dialCode: '+691', flag: '🇫🇲' },
  { code: 'MH', name: 'جزر مارشال', dialCode: '+692', flag: '🇲🇭' },
  { code: 'KR', name: 'كوريا الجنوبية', dialCode: '+82', flag: '🇰🇷' },
  { code: 'KP', name: 'كوريا الشمالية', dialCode: '+850', flag: '🇰🇵' },
  { code: 'MN', name: 'منغوليا', dialCode: '+976', flag: '🇲🇳' },
  { code: 'TW', name: 'تايوان', dialCode: '+886', flag: '🇹🇼' },
  { code: 'HK', name: 'هونغ كونغ', dialCode: '+852', flag: '🇭🇰' },
  { code: 'MO', name: 'ماكاو', dialCode: '+853', flag: '🇲🇴' },
  { code: 'TH', name: 'تايلاند', dialCode: '+66', flag: '🇹🇭' },
  { code: 'VN', name: 'فيتنام', dialCode: '+84', flag: '🇻🇳' },
  { code: 'LA', name: 'لاوس', dialCode: '+856', flag: '🇱🇦' },
  { code: 'KH', name: 'كمبوديا', dialCode: '+855', flag: '🇰🇭' },
  { code: 'MM', name: 'ميانمار', dialCode: '+95', flag: '🇲🇲' },
  { code: 'MY', name: 'ماليزيا', dialCode: '+60', flag: '🇲🇾' },
  { code: 'SG', name: 'سنغافورة', dialCode: '+65', flag: '🇸🇬' },
  { code: 'BN', name: 'بروناي', dialCode: '+673', flag: '🇧🇳' },
  { code: 'ID', name: 'إندونيسيا', dialCode: '+62', flag: '🇮🇩' },
  { code: 'TL', name: 'تيمور الشرقية', dialCode: '+670', flag: '🇹🇱' },
  { code: 'PH', name: 'الفلبين', dialCode: '+63', flag: '🇵🇭' },
  { code: 'BD', name: 'بنغلاديش', dialCode: '+880', flag: '🇧🇩' },
  { code: 'BT', name: 'بوتان', dialCode: '+975', flag: '🇧🇹' },
  { code: 'NP', name: 'نيبال', dialCode: '+977', flag: '🇳🇵' },
  { code: 'LK', name: 'سريلانكا', dialCode: '+94', flag: '🇱🇰' },
  { code: 'MV', name: 'المالديف', dialCode: '+960', flag: '🇲🇻' },
  { code: 'NG', name: 'نيجيريا', dialCode: '+234', flag: '🇳🇬' },
  { code: 'ET', name: 'إثيوبيا', dialCode: '+251', flag: '🇪🇹' },
  { code: 'ZA', name: 'جنوب أفريقيا', dialCode: '+27', flag: '🇿🇦' },
  { code: 'KE', name: 'كينيا', dialCode: '+254', flag: '🇰🇪' },
  { code: 'UG', name: 'أوغندا', dialCode: '+256', flag: '🇺🇬' },
  { code: 'TZ', name: 'تنزانيا', dialCode: '+255', flag: '🇹🇿' },
  { code: 'RW', name: 'رواندا', dialCode: '+250', flag: '🇷🇼' },
  { code: 'BI', name: 'بوروندي', dialCode: '+257', flag: '🇧🇮' },
  { code: 'MW', name: 'مالاوي', dialCode: '+265', flag: '🇲🇼' },
  { code: 'ZM', name: 'زامبيا', dialCode: '+260', flag: '🇿🇲' },
  { code: 'ZW', name: 'زيمبابوي', dialCode: '+263', flag: '🇿🇼' },
  { code: 'BW', name: 'بوتسوانا', dialCode: '+267', flag: '🇧🇼' },
  { code: 'NA', name: 'ناميبيا', dialCode: '+264', flag: '🇳🇦' },
  { code: 'SZ', name: 'إسواتيني', dialCode: '+268', flag: '🇸🇿' },
  { code: 'LS', name: 'ليسوتو', dialCode: '+266', flag: '🇱🇸' },
  { code: 'MZ', name: 'موزمبيق', dialCode: '+258', flag: '🇲🇿' },
  { code: 'MG', name: 'مدغشقر', dialCode: '+261', flag: '🇲🇬' },
  { code: 'MU', name: 'موريشيوس', dialCode: '+230', flag: '🇲🇺' },
  { code: 'SC', name: 'سيشل', dialCode: '+248', flag: '🇸🇨' },
  { code: 'KM', name: 'جزر القمر', dialCode: '+269', flag: '🇰🇲' },
  { code: 'CV', name: 'الرأس الأخضر', dialCode: '+238', flag: '🇨🇻' },
  { code: 'ST', name: 'ساو تومي وبرينسيبي', dialCode: '+239', flag: '🇸🇹' },
  { code: 'GQ', name: 'غينيا الاستوائية', dialCode: '+240', flag: '🇬🇶' },
  { code: 'GA', name: 'الغابون', dialCode: '+241', flag: '🇬🇦' },
  { code: 'CG', name: 'جمهورية الكونغو', dialCode: '+242', flag: '🇨🇬' },
  { code: 'CD', name: 'جمهورية الكونغو الديمقراطية', dialCode: '+243', flag: '🇨🇩' },
  { code: 'CF', name: 'جمهورية أفريقيا الوسطى', dialCode: '+236', flag: '🇨🇫' },
  { code: 'CM', name: 'الكاميرون', dialCode: '+237', flag: '🇨🇲' },
  { code: 'TD', name: 'تشاد', dialCode: '+235', flag: '🇹🇩' },
  { code: 'NE', name: 'النيجر', dialCode: '+227', flag: '🇳🇪' },
  { code: 'BF', name: 'بوركينا فاسو', dialCode: '+226', flag: '🇧🇫' },
  { code: 'ML', name: 'مالي', dialCode: '+223', flag: '🇲🇱' },
  { code: 'SN', name: 'السنغال', dialCode: '+221', flag: '🇸🇳' },
  { code: 'GM', name: 'غامبيا', dialCode: '+220', flag: '🇬🇲' },
  { code: 'GW', name: 'غينيا بيساو', dialCode: '+245', flag: '🇬🇼' },
  { code: 'GN', name: 'غينيا', dialCode: '+224', flag: '🇬🇳' },
  { code: 'SL', name: 'سيراليون', dialCode: '+232', flag: '🇸🇱' },
  { code: 'LR', name: 'ليبيريا', dialCode: '+231', flag: '🇱🇷' },
  { code: 'CI', name: 'ساحل العاج', dialCode: '+225', flag: '🇨🇮' },
  { code: 'GH', name: 'غانا', dialCode: '+233', flag: '🇬🇭' },
  { code: 'TG', name: 'توغو', dialCode: '+228', flag: '🇹🇬' },
  { code: 'BJ', name: 'بنين', dialCode: '+229', flag: '🇧🇯' },
  { code: 'ER', name: 'إريتريا', dialCode: '+291', flag: '🇪🇷' }
];

// Function to detect country by IP (using a free service)
export const detectCountryByIP = async () => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.country_code || 'SA'; // Default to Saudi Arabia
  } catch (error) {
    console.log('Could not detect country by IP:', error);
    return 'SA'; // Default to Saudi Arabia
  }
};

// Function to get country by timezone (fallback method)
export const detectCountryByTimezone = () => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const timezoneToCountry = {
    'Asia/Riyadh': 'SA',
    'Asia/Kuwait': 'KW',
    'Asia/Qatar': 'QA',
    'Asia/Bahrain': 'BH',
    'Asia/Dubai': 'AE',
    'Asia/Muscat': 'OM',
    'Africa/Cairo': 'EG',
    'Asia/Amman': 'JO',
    'Asia/Beirut': 'LB',
    'Asia/Damascus': 'SY',
    'Asia/Baghdad': 'IQ',
    'Asia/Gaza': 'PS',
    'Africa/Casablanca': 'MA',
    'Africa/Algiers': 'DZ',
    'Africa/Tunis': 'TN',
    'Africa/Tripoli': 'LY',
    'Africa/Khartoum': 'SD',
    'Asia/Aden': 'YE',
    'Africa/Mogadishu': 'SO',
    'Africa/Djibouti': 'DJ',
    'Africa/Nouakchott': 'MR',
    'America/New_York': 'US',
    'America/Los_Angeles': 'US',
    'America/Chicago': 'US',
    'America/Denver': 'US',
    'America/Toronto': 'CA',
    'America/Vancouver': 'CA',
    'Europe/London': 'GB',
    'Europe/Paris': 'FR',
    'Europe/Berlin': 'DE',
    'Europe/Rome': 'IT',
    'Europe/Madrid': 'ES',
    'Europe/Amsterdam': 'NL',
    'Europe/Brussels': 'BE',
    'Europe/Zurich': 'CH',
    'Europe/Vienna': 'AT',
    'Europe/Stockholm': 'SE',
    'Europe/Oslo': 'NO',
    'Europe/Copenhagen': 'DK',
    'Europe/Helsinki': 'FI',
    'Europe/Warsaw': 'PL',
    'Europe/Prague': 'CZ',
    'Europe/Budapest': 'HU',
    'Europe/Bucharest': 'RO',
    'Europe/Sofia': 'BG',
    'Europe/Athens': 'GR',
    'Europe/Istanbul': 'TR',
    'Europe/Moscow': 'RU',
    'Asia/Shanghai': 'CN',
    'Asia/Tokyo': 'JP',
    'Asia/Seoul': 'KR',
    'Asia/Kolkata': 'IN',
    'Asia/Karachi': 'PK',
    'Asia/Dhaka': 'BD',
    'Asia/Colombo': 'LK',
    'Asia/Bangkok': 'TH',
    'Asia/Ho_Chi_Minh': 'VN',
    'Asia/Manila': 'PH',
    'Asia/Kuala_Lumpur': 'MY',
    'Asia/Singapore': 'SG',
    'Asia/Jakarta': 'ID',
    'Australia/Sydney': 'AU',
    'Australia/Melbourne': 'AU',
    'Pacific/Auckland': 'NZ',
    'Africa/Johannesburg': 'ZA',
    'Africa/Lagos': 'NG',
    'Africa/Nairobi': 'KE',
    'Africa/Addis_Ababa': 'ET',
    'America/Sao_Paulo': 'BR',
    'America/Argentina/Buenos_Aires': 'AR',
    'America/Santiago': 'CL',
    'America/Bogota': 'CO',
    'America/Lima': 'PE',
    'America/Caracas': 'VE',
    'America/Mexico_City': 'MX',
    'Asia/Tehran': 'IR'
  };
  
  return timezoneToCountry[timezone] || 'SA';
};

// Function to get country data by code
export const getCountryByCode = (code) => {
  return countries.find(country => country.code === code) || countries.find(country => country.code === 'SA');
};

// Function to validate phone number based on country
export const validatePhoneNumber = (phoneNumber, countryCode) => {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  // Country-specific validation patterns and examples
  const validationData = {
    'SA': { 
      pattern: /^[5-9]\d{8}$/, 
      example: '501234567',
      description: 'مثال: 501234567 (9 أرقام تبدأ بـ 5-9)'
    },
    'EG': { 
      pattern: /^[1-9]\d{7,10}$/, 
      example: '1012345678',
      description: 'مثال: 1012345678 (8-11 رقم)'
    },
    'AE': { 
      pattern: /^[5-9]\d{8}$/, 
      example: '501234567',
      description: 'مثال: 501234567 (9 أرقام تبدأ بـ 5-9)'
    },
    'KW': { 
      pattern: /^[2-9]\d{7}$/, 
      example: '51234567',
      description: 'مثال: 51234567 (8 أرقام تبدأ بـ 2-9)'
    },
    'QA': { 
      pattern: /^[3-7]\d{7}$/, 
      example: '55123456',
      description: 'مثال: 55123456 (8 أرقام تبدأ بـ 3-7)'
    },
    'BH': { 
      pattern: /^[3-9]\d{7}$/, 
      example: '36123456',
      description: 'مثال: 36123456 (8 أرقام تبدأ بـ 3-9)'
    },
    'OM': { 
      pattern: /^[7-9]\d{7}$/, 
      example: '91234567',
      description: 'مثال: 91234567 (8 أرقام تبدأ بـ 7-9)'
    },
    'JO': { 
      pattern: /^[7-9]\d{8}$/, 
      example: '791234567',
      description: 'مثال: 791234567 (9 أرقام تبدأ بـ 7-9)'
    },
    'LB': { 
      pattern: /^[3-9]\d{7}$/, 
      example: '71123456',
      description: 'مثال: 71123456 (8 أرقام تبدأ بـ 3-9)'
    },
    'US': { 
      pattern: /^[2-9]\d{9}$/, 
      example: '2125551234',
      description: 'Example: 2125551234 (10 digits, first digit 2-9)'
    },
    'GB': { 
      pattern: /^[1-9]\d{9,10}$/, 
      example: '7911123456',
      description: 'Example: 7911123456 (10-11 digits)'
    },
    'FR': { 
      pattern: /^[1-9]\d{8}$/, 
      example: '612345678',
      description: 'Exemple: 612345678 (9 digits)'
    },
    'DE': { 
      pattern: /^[1-9]\d{10,11}$/, 
      example: '15123456789',
      description: 'Beispiel: 15123456789 (11-12 digits)'
    },
    'IN': { 
      pattern: /^[6-9]\d{9}$/, 
      example: '9876543210',
      description: 'Example: 9876543210 (10 digits starting with 6-9)'
    },
    'PK': { 
      pattern: /^[3]\d{9}$/, 
      example: '3001234567',
      description: 'Example: 3001234567 (10 digits starting with 3)'
    },
    'CN': { 
      pattern: /^[1]\d{10}$/, 
      example: '13812345678',
      description: 'Example: 13812345678 (11 digits starting with 1)'
    },
    'JP': { 
      pattern: /^[7-9]\d{9,10}$/, 
      example: '9012345678',
      description: 'مثال: 9012345678 (10-11 رقم تبدأ بـ 7-9)'
    },
    'SY': { 
      pattern: /^[9]\d{8}$/, 
      example: '912345678',
      description: 'مثال: 912345678 (9 أرقام تبدأ بـ 9)'
    },
    'IQ': { 
      pattern: /^[7]\d{9}$/, 
      example: '7901234567',
      description: 'مثال: 7901234567 (10 أرقام تبدأ بـ 7)'
    },
    'PS': { 
      pattern: /^[5-9]\d{8}$/, 
      example: '591234567',
      description: 'مثال: 591234567 (9 أرقام تبدأ بـ 5-9)'
    },
    'MA': { 
      pattern: /^[6-7]\d{8}$/, 
      example: '612345678',
      description: 'مثال: 612345678 (9 أرقام تبدأ بـ 6-7)'
    },
    'DZ': { 
      pattern: /^[5-7]\d{8}$/, 
      example: '551234567',
      description: 'مثال: 551234567 (9 أرقام تبدأ بـ 5-7)'
    },
    'TN': { 
      pattern: /^[2-9]\d{7}$/, 
      example: '21234567',
      description: 'مثال: 21234567 (8 أرقام تبدأ بـ 2-9)'
    },
    'LY': { 
      pattern: /^[9]\d{8}$/, 
      example: '912345678',
      description: 'مثال: 912345678 (9 أرقام تبدأ بـ 9)'
    },
    'SD': { 
      pattern: /^[9]\d{8}$/, 
      example: '912345678',
      description: 'مثال: 912345678 (9 أرقام تبدأ بـ 9)'
    },
    'YE': { 
      pattern: /^[7]\d{8}$/, 
      example: '712345678',
      description: 'مثال: 712345678 (9 أرقام تبدأ بـ 7)'
    },
    'SO': { 
      pattern: /^[6-9]\d{8}$/, 
      example: '612345678',
      description: 'مثال: 612345678 (9 أرقام تبدأ بـ 6-9)'
    },
    'DJ': { 
      pattern: /^[7]\d{7}$/, 
      example: '77123456',
      description: 'مثال: 77123456 (8 أرقام تبدأ بـ 7)'
    },
    'MR': { 
      pattern: /^[2-4]\d{7}$/, 
      example: '22123456',
      description: 'مثال: 22123456 (8 أرقام تبدأ بـ 2-4)'
    },
    'TR': { 
      pattern: /^[5]\d{9}$/, 
      example: '5321234567',
      description: 'مثال: 5321234567 (10 أرقام تبدأ بـ 5)'
    },
    'IR': { 
      pattern: /^[9]\d{9}$/, 
      example: '9123456789',
      description: 'مثال: 9123456789 (10 أرقام تبدأ بـ 9)'
    },
    'AF': { 
      pattern: /^[7]\d{8}$/, 
      example: '701234567',
      description: 'مثال: 701234567 (9 أرقام تبدأ بـ 7)'
    },
    'CA': { 
      pattern: /^[2-9]\d{9}$/, 
      example: '4161234567',
      description: 'مثال: 4161234567 (10 أرقام تبدأ بـ 2-9)'
    },
    'AU': { 
      pattern: /^[4]\d{8}$/, 
      example: '412345678',
      description: 'مثال: 412345678 (9 أرقام تبدأ بـ 4)'
    },
    'NZ': { 
      pattern: /^[2]\d{7,9}$/, 
      example: '21234567',
      description: 'مثال: 21234567 (8-10 أرقام تبدأ بـ 2)'
    },
    'BR': { 
      pattern: /^[1-9]\d{10}$/, 
      example: '11987654321',
      description: 'مثال: 11987654321 (11 رقم)'
    },
    'MX': { 
      pattern: /^[1-9]\d{9}$/, 
      example: '5512345678',
      description: 'مثال: 5512345678 (10 أرقام)'
    },
    'AR': { 
      pattern: /^[1-9]\d{9}$/, 
      example: '1123456789',
      description: 'مثال: 1123456789 (10 أرقام)'
    },
    'ZA': { 
      pattern: /^[6-8]\d{8}$/, 
      example: '821234567',
      description: 'مثال: 821234567 (9 أرقام تبدأ بـ 6-8)'
    },
    'NG': { 
      pattern: /^[7-9]\d{9}$/, 
      example: '8012345678',
      description: 'مثال: 8012345678 (10 أرقام تبدأ بـ 7-9)'
    },
    'KE': { 
      pattern: /^[7]\d{8}$/, 
      example: '712345678',
      description: 'مثال: 712345678 (9 أرقام تبدأ بـ 7)'
    },
    'ET': { 
      pattern: /^[9]\d{8}$/, 
      example: '912345678',
      description: 'مثال: 912345678 (9 أرقام تبدأ بـ 9)'
    },
  };
  
  const countryData = validationData[countryCode];
  if (countryData) {
    if (!countryData.pattern.test(cleanPhone)) {
      return `رقم الهاتف غير صحيح لهذا البلد. ${countryData.description}`;
    }
  } else {
    // Generic international validation
    if (cleanPhone.length < 7 || cleanPhone.length > 15) {
      return 'رقم الهاتف يجب أن يكون بين 7 و 15 رقم';
    }
  }
  
  return null;
};