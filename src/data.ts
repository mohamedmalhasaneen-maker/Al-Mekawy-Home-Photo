import { CatalogCategory, Advantage } from './types';

// صور افتراضية فائقة الدقة بتنسيق SVG لمنع حدوث أي روابط مكسورة ولتقديم تجربة تصفح فاخرة فور التشغيل
export const DEFAULT_IMAGES = {
  doorsCover: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%"><rect width="800" height="600" fill="%230f172a"/><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231e293b"/><stop offset="100%" stop-color="%230f172a"/></linearGradient><linearGradient id="g2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%2338bdf8" stop-opacity="0.8"/><stop offset="100%" stop-color="%230284c7" stop-opacity="0.9"/></linearGradient></defs><rect width="800" height="600" fill="url(%23g1)"/><g transform="translate(100, 50)"><rect x="180" y="50" width="240" height="420" rx="8" fill="%231e293b" stroke="%2338bdf8" stroke-width="8"/><rect x="210" y="80" width="180" height="150" fill="url(%23g2)" stroke="%2338bdf8" stroke-width="4"/><line x1="210" y1="155" x2="390" y2="155" stroke="%2338bdf8" stroke-width="4"/><line x1="300" y1="80" x2="300" y2="230" stroke="%2338bdf8" stroke-width="4"/><rect x="210" y="250" width="180" height="190" fill="%23334155" stroke="%23475569" stroke-width="2"/><circle cx="230" cy="270" r="10" fill="%2338bdf8"/><circle cx="230" cy="310" r="10" fill="%2338bdf8"/><circle cx="230" cy="350" r="10" fill="%2338bdf8"/><rect x="250" y="270" width="110" height="150" rx="4" fill="%231e293b"/><path d="M 270 290 L 340 290 M 270 320 L 340 320 M 270 350 L 340 350" stroke="%23475569" stroke-width="4" stroke-linecap="round"/><rect x="390" y="210" width="15" height="80" rx="5" fill="%2338bdf8"/><circle cx="397" cy="250" r="4" fill="%23f8fafc"/><text x="300" y="510" fill="%23f8fafc" font-family="system-ui, sans-serif" font-size="22" font-weight="bold" text-anchor="middle">أبواب الـ PVC الفاخرة</text><text x="300" y="535" fill="%2394a3b8" font-family="system-ui, sans-serif" font-size="14" text-anchor="middle">عزل حراري وصوتي مطلق وأمان متكامل</text></g></svg>`,

  windowsCover: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%"><rect width="800" height="600" fill="%230f172a"/><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231e293b"/><stop offset="100%" stop-color="%230f172a"/></linearGradient><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2338bdf8" stop-opacity="0.85"/><stop offset="100%" stop-color="%230369a1" stop-opacity="0.95"/></linearGradient></defs><rect width="800" height="600" fill="url(%23g1)"/><g transform="translate(100, 50)"><rect x="120" y="70" width="360" height="360" rx="8" fill="%231e293b" stroke="%2338bdf8" stroke-width="8"/><rect x="140" y="90" width="150" height="320" rx="4" fill="url(%23g2)" stroke="%2338bdf8" stroke-width="4"/><rect x="310" y="90" width="150" height="320" rx="4" fill="url(%23g2)" stroke="%2338bdf8" stroke-width="4"/><line x1="140" y1="250" x2="290" y2="250" stroke="%2338bdf8" stroke-width="4"/><line x1="310" y1="250" x2="460" y2="250" stroke="%2338bdf8" stroke-width="4"/><rect x="282" y="220" width="10" height="60" rx="3" fill="%2338bdf8"/><rect x="308" y="220" width="10" height="60" rx="3" fill="%2338bdf8"/><path d="M 170 120 L 260 120 L 260 210 Z" fill="%23ffffff" fill-opacity="0.2"/><path d="M 340 120 L 430 120 L 430 210 Z" fill="%23ffffff" fill-opacity="0.2"/><text x="300" y="470" fill="%23f8fafc" font-family="system-ui, sans-serif" font-size="22" font-weight="bold" text-anchor="middle">شبابيك الـ PVC المقاومة للعوامل الجوية</text><text x="300" y="495" fill="%2394a3b8" font-family="system-ui, sans-serif" font-size="14" text-anchor="middle">تصاميم أوروبية بإحكام إغلاق تام عازل للأتربة</text></g></svg>`,

  doorSliding: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%"><rect width="600" height="450" fill="%231e293b"/><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230284c7" stop-opacity="0.4"/><stop offset="100%" stop-color="%230f172a" stop-opacity="0.8"/></linearGradient></defs><rect x="50" y="40" width="500" height="320" rx="6" fill="%230f172a" stroke="%2338bdf8" stroke-width="6"/><rect x="70" y="60" width="220" height="280" fill="url(%23g)" stroke="%2338bdf8" stroke-width="4"/><rect x="290" y="60" width="240" height="280" fill="url(%23g)" stroke="%230284c7" stroke-width="4"/><path d="M 120 100 L 200 100 L 200 180 Z" fill="%23ffffff" fill-opacity="0.15"/><path d="M 340 100 L 420 100 L 420 180 Z" fill="%23ffffff" fill-opacity="0.15"/><rect x="260" y="170" width="12" height="60" rx="4" fill="%23f8fafc"/><rect x="300" y="170" width="12" height="60" rx="4" fill="%23f8fafc"/><path d="M 240 200 L 210 200 M 210 200 L 220 190 M 210 200 L 220 210" stroke="%2338bdf8" stroke-width="3" stroke-linecap="round"/><path d="M 340 200 L 370 200 M 370 200 L 360 190 M 370 200 L 360 210" stroke="%2338bdf8" stroke-width="3" stroke-linecap="round"/><text x="300" y="405" fill="%23f8fafc" font-family="system-ui, sans-serif" font-size="18" font-weight="bold" text-anchor="middle">قطاع الأبواب الجرار (Sliding Door)</text></svg>`,

  doorHinged: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%"><rect width="600" height="450" fill="%231e293b"/><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230284c7" stop-opacity="0.35"/><stop offset="100%" stop-color="%230f172a" stop-opacity="0.75"/></linearGradient></defs><rect x="150" y="40" width="300" height="340" rx="6" fill="%230f172a" stroke="%2338bdf8" stroke-width="6"/><rect x="180" y="70" width="240" height="280" fill="url(%23g)" stroke="%2338bdf8" stroke-width="4"/><path d="M 210 110 L 330 110 L 330 200 Z" fill="%23ffffff" fill-opacity="0.15"/><rect x="400" y="180" width="12" height="60" rx="3" fill="%23f8fafc"/><path d="M 400 180 C 430 190 430 230 400 240" stroke="%2338bdf8" stroke-width="3" fill="none" stroke-dasharray="4,4"/><text x="300" y="415" fill="%23f8fafc" font-family="system-ui, sans-serif" font-size="18" font-weight="bold" text-anchor="middle">قطاع الأبواب المفصلي (Hinged Door)</text></svg>`,

  windowGerman: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%"><rect width="600" height="450" fill="%231e293b"/><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230284c7" stop-opacity="0.5"/><stop offset="100%" stop-color="%230f172a" stop-opacity="0.85"/></linearGradient></defs><rect x="120" y="40" width="360" height="320" rx="6" fill="%230f172a" stroke="%2338bdf8" stroke-width="6"/><rect x="145" y="65" width="310" height="270" fill="url(%23g)" stroke="%2338bdf8" stroke-width="4"/><line x1="300" y1="65" x2="300" y2="335" stroke="%2338bdf8" stroke-width="4"/><path d="M 170 100 L 260 100 L 260 180 Z" fill="%23ffffff" fill-opacity="0.15"/><rect x="280" y="170" width="10" height="50" rx="3" fill="%23f8fafc"/><circle cx="300" cy="90" r="8" fill="%2322c55e"/><text x="300" y="405" fill="%23f8fafc" font-family="system-ui, sans-serif" font-size="18" font-weight="bold" text-anchor="middle">القطاع الألماني عالي العزل (German Profile)</text></svg>`,

  windowTurkish: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%"><rect width="600" height="450" fill="%231e293b"/><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230284c7" stop-opacity="0.4"/><stop offset="100%" stop-color="%230f172a" stop-opacity="0.8"/></linearGradient></defs><rect x="100" y="40" width="400" height="320" rx="6" fill="%230f172a" stroke="%2338bdf8" stroke-width="6"/><rect x="125" y="65" width="170" height="270" fill="url(%23g)" stroke="%2338bdf8" stroke-width="4"/><rect x="295" y="65" width="180" height="270" fill="url(%23g)" stroke="%230284c7" stroke-width="4"/><rect x="270" y="160" width="10" height="50" rx="3" fill="%23f8fafc"/><text x="300" y="405" fill="%23f8fafc" font-family="system-ui, sans-serif" font-size="18" font-weight="bold" text-anchor="middle">القطاع التركي الاقتصادي الفاخر (Turkish Profile)</text></svg>`,

  // صور معرض افتراضية لمشاريع المكاوي
  gallerySample1: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%"><rect width="800" height="600" fill="%231e293b"/><rect x="100" y="100" width="600" height="400" fill="%230f172a" rx="10" stroke="%2338bdf8" stroke-width="4"/><circle cx="400" cy="300" r="120" fill="%231e293b" stroke="%2338bdf8" stroke-width="3"/><line x1="400" y1="180" x2="400" y2="420" stroke="%2338bdf8" stroke-width="3"/><line x1="280" y1="300" x2="520" y2="300" stroke="%2338bdf8" stroke-width="3"/><path d="M 310 210 Q 400 300 490 210" fill="none" stroke="%2338bdf8" stroke-width="2"/><text x="400" y="540" fill="%2338bdf8" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" text-anchor="middle">فيلا التجمع الخامس - شبابيك دبل زجاج جورجيا</text></svg>`,

  gallerySample2: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%"><rect width="800" height="600" fill="%231e293b"/><rect x="150" y="50" width="500" height="500" fill="%230f172a" rx="10" stroke="%2338bdf8" stroke-width="4"/><line x1="400" y1="50" x2="400" y2="550" stroke="%2338bdf8" stroke-width="4"/><circle cx="350" cy="300" r="8" fill="%23f8fafc"/><circle cx="450" cy="300" r="8" fill="%23f8fafc"/><text x="400" y="580" fill="%2338bdf8" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" text-anchor="middle">واجهة مودرن - أبواب سحاب زجاج عاكس أزرق</text></svg>`,

  gallerySample3: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%"><rect width="800" height="600" fill="%231e293b"/><rect x="80" y="80" width="640" height="440" fill="%230f172a" rx="10" stroke="%2338bdf8" stroke-width="4"/><line x1="240" y1="80" x2="240" y2="520" stroke="%2338bdf8" stroke-width="3"/><line x1="560" y1="80" x2="560" y2="520" stroke="%2338bdf8" stroke-width="3"/><line x1="80" y1="300" x2="720" y2="300" stroke="%2338bdf8" stroke-width="3"/><text x="400" y="560" fill="%2338bdf8" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" text-anchor="middle">مشروع الشروق - قطاعات جرارة دبل متكاملة العزل</text></svg>`,

  gallerySample4: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%"><rect width="800" height="600" fill="%231e293b"/><rect x="200" y="80" width="400" height="440" fill="%230f172a" rx="10" stroke="%2338bdf8" stroke-width="4"/><path d="M 250 150 L 550 150 L 550 450 L 250 450 Z" fill="none" stroke="%2338bdf8" stroke-width="3"/><line x1="400" y1="150" x2="400" y2="450" stroke="%2338bdf8" stroke-width="2"/><text x="400" y="560" fill="%2338bdf8" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" text-anchor="middle">مكتب إداري - قطاعات عازلة للصوت والضوضاء</text></svg>`,
};

export const INITIAL_ADVANTAGES: Advantage[] = [
  {
    icon: 'Shield',
    title: 'عزل صوتي تام',
    description: 'عزل خارجي مثالي للضوضاء والأصوات بنسبة تصل لـ 45 ديسبل لتنعم بهدوء وراحة في منزلك.'
  },
  {
    icon: 'Flame',
    title: 'توفير استهلاك الطاقة والعزل الحراري',
    description: 'تمنع قطاعات الـ PVC تسريب الحرارة والتكييف تماماً، مما يقلل فواتير الكهرباء بنسبة تصل لـ 40%.'
  },
  {
    icon: 'Wind',
    title: 'مقاومة تامة للغبار والأتربة والماء',
    description: 'نظام كاوتش مزدوج (EDPM seals) يمنع تماماً دخول الأتربة ومياه الأمطار والرياح إلى الداخل.'
  },
  {
    icon: 'Lock',
    title: 'متانة وأمان ضد السرقة والحرائق',
    description: 'القطاعات مسلحة بالحديد المجلفن المتين من الداخل ومزودة بإكسسوارات حماية متعددة نقاط الغلق.'
  }
];

export const INITIAL_CATALOG: CatalogCategory[] = [
  {
    id: 'doors',
    title: 'أبواب الـ PVC',
    englishTitle: 'PVC Doors',
    description: 'أبواب عصرية تجمع بين الفخامة، العزل الفائق ومستويات الأمان العالية المسلحة بالصلب المجلفن.',
    image: DEFAULT_IMAGES.doorsCover,
    subtypes: [
      {
        id: 'door-sliding',
        name: 'قطاع جرار (Sliding)',
        englishName: 'Sliding Sector Door',
        description: 'مثالي للمساحات الضيقة والمطابخ والحدائق والشرفات، يوفر سهولة فائقة في الحركة وحفظ المساحات مع عزل مائي وحراري معزز.',
        image: DEFAULT_IMAGES.doorSliding,
        gallery: [DEFAULT_IMAGES.gallerySample2, DEFAULT_IMAGES.gallerySample3],
        features: [
          'تصميم ذكي يوفر المساحة بالكامل عند الفتح والغلق.',
          'عجلات من مادة التيفلون القوية لضمان حركة صامتة وسلسة.',
          'عزل ممتاز للأتربة والمطر والرياح بفضل الفرش الكثيف والكاوتش الحامي.',
          'إمكانية تركيب زجاج سنجل أو دبل عازل للصوت والحرارة.',
          'أقفال متعددة النقاط لزيادة كفاءة الأمان والتحكم.'
        ],
        specs: {
          chambers: '3 إلى 5 غرف عزل حراري لتأمين منزلك',
          insulation: 'U-Value: 1.4 - 1.6 W/m²K ممتاز في درجات الحرارة العالية',
          glassCompatibility: 'يدعم سمك زجاج دبل عازل من 6 ملم حتى 24 ملم',
          durability: 'عمر افتراضي يفوق 40 عاماً مقاوم تماماً للأملاح والخدوش',
          origin: 'قطاع تركي متميز مع تسليح حديد مجلفن داخلي سماكة 1.5 ملم'
        }
      },
      {
        id: 'door-hinged',
        name: 'قطاع مفصلي (Hinged)',
        englishName: 'Hinged Sector Door',
        description: 'الأبواب المفصلية الكلاسيكية للمداخل الرئسية، الحمامات والمطابخ وأبواب الغرف، بأعلى مستويات الإحكام وعزل الصوت والأمان المتكامل.',
        image: DEFAULT_IMAGES.doorHinged,
        gallery: [DEFAULT_IMAGES.gallerySample1, DEFAULT_IMAGES.gallerySample4],
        features: [
          'إحكام غلق تام بفضل الكاوتش المزدوج حول إطار الباب والقطاع.',
          'مفصلات قوية مصممة لتحمل الأوزان الثقيلة والاستخدام الشاق.',
          'نظام قفل الأمان متعدد النقاط (Multipoint Lock) للأبواب الرئيسية.',
          'تصاميم متنوعة تناسب الأشكال الزخرفية والزجاج المصنفر/المزخرف.',
          'مقاوم تماماً للرطوبة والمياه، مما يجعله مثالياً للحمامات والمطابخ.'
        ],
        specs: {
          chambers: '4 إلى 6 غرف في الحلق والضلفة لعزل تام',
          insulation: 'U-Value: 1.2 - 1.4 W/m²K عزل حراري استثنائي',
          glassCompatibility: 'يدعم زجاج سنجل/دبل/تربل عازل للصوت والحرارة',
          durability: 'ثبات لوني ومقاومة تامة للتمدد والتقلص مع الرطوبة العالية',
          origin: 'قطاع ألماني فاخر مع إكسسوارات قفل أوروبية أصلية'
        }
      }
    ]
  },
  {
    id: 'windows',
    title: 'شبابيك الـ PVC',
    englishTitle: 'PVC Windows',
    description: 'شبابيك عالية العزل والتحمل، عازلة للغبار ومياه الأمطار والضوضاء، متوفرة بأرقى قطاعات العالم.',
    image: DEFAULT_IMAGES.windowsCover,
    subtypes: [
      {
        id: 'window-german',
        name: 'القطاع الألماني (German Profile)',
        englishName: 'German Premium Profile',
        description: 'الخيار الأول للقصور والفلل الفاخرة التي تطلب أعلى مستويات الجودة والعزل الصوتي والحراري في العالم بمواصفات أوروبية معتمدة.',
        image: DEFAULT_IMAGES.windowGerman,
        gallery: [DEFAULT_IMAGES.gallerySample1, DEFAULT_IMAGES.gallerySample4, DEFAULT_IMAGES.gallerySample2],
        features: [
          'خامات بي في سي فائقة النقاء مقاومة لأقسى درجات الحرارة والأشعة البنفسجية UV.',
          'أنظمة فتح مرنة: مفصلي، قلاب (Tilt & Turn)، أو سحاب عالي المتانة.',
          'عزل صوتي فائق الروعة يحجب أكثر من 95% من الضوضاء والازدحام الخارجي.',
          'تسليح فولاذي مجلفن متكامل سماكة 2 ملم داخل الحلق لثبات وقوة جبارة.',
          'مقاومة ممتازة للرياح والضغط العالي، ممتاز للشقق في الأدوار المرتفعة والمناطق الساحلية.'
        ],
        specs: {
          chambers: '5 غرف عزل ذكية في الضلفة والحلق للتحكم التام بالحرارة والصوت',
          insulation: 'U-Value: 1.1 W/m²K الأعلى على الإطلاق لراحة استثنائية',
          glassCompatibility: 'يدعم زجاج دبل/تربل مع شريط ألومنيوم حتى سماكة 32 ملم',
          durability: 'مضمون لـ 50 عاماً ضد التغير اللوني والتقصف، غير قابل للاشتعال',
          origin: 'صناعة ألمانية بنسبة 100% (أعلى درجات الفخامة والمتانة عالمياً)'
        }
      },
      {
        id: 'window-turkish',
        name: 'القطاع التركي (Turkish Profile)',
        englishName: 'Turkish Value Profile',
        description: 'التوازن المثالي بين السعر الاقتصادي المنافس والمتانة والجمال الفائق، القطاع الأكثر طلباً وشعبية بالمواصفات القياسية.',
        image: DEFAULT_IMAGES.windowTurkish,
        gallery: [DEFAULT_IMAGES.gallerySample3, DEFAULT_IMAGES.gallerySample2, DEFAULT_IMAGES.gallerySample1],
        features: [
          'تكلفة معتدلة ومنافسة جداً تناسب المشاريع والعمائر والتشطيب السكني المميز.',
          'عزل حراري ممتاز يقلل بشكل رائع استهلاك أجهزة التبريد في الصيف.',
          'مقاومة ممتازة للمياه بفضل مخارج تصريف مدمجة وقنوات ذكية لتصريف المياه للخارج.',
          'إكسسوارات مرنة عالية الجودة وضمان طويل الأمد على الألوان واللحامات.',
          'تنوع رائع في الألوان (مثل الخشبي، الرمادي الأنتراسيت، والأبيض اللامع).'
        ],
        specs: {
          chambers: '3 إلى 4 غرف عزل ممتازة وفعالة',
          insulation: 'U-Value: 1.4 W/m²K ممتاز ومناسب جداً للمناطق الحارة والباردة',
          glassCompatibility: 'يدعم زجاج دبل سماكة 18-22 ملم وزجاج فردي سماكة 6 ملم',
          durability: 'مقاوم كامل للرطوبة وللخدوش ومستقر لونيًا في الأجواء العربية المشمسة',
          origin: 'تركي أصلي ممتاز مع تسليح حديد داخلي معتمد'
        }
      }
    ]
  }
];

export const INITIAL_THREE_TAB_PHOTOS = {
  doors: [
    DEFAULT_IMAGES.doorSliding,
    DEFAULT_IMAGES.doorHinged,
    DEFAULT_IMAGES.gallerySample2
  ],
  windows: [
    DEFAULT_IMAGES.windowGerman,
    DEFAULT_IMAGES.windowTurkish,
    DEFAULT_IMAGES.gallerySample1
  ],
  balconies: [
    `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%"><rect width="800" height="600" fill="%230f172a"/><defs><linearGradient id="bgG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231e293b"/><stop offset="100%" stop-color="%230f172a"/></linearGradient><linearGradient id="glassG" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%2338bdf8" stop-opacity="0.3"/><stop offset="100%" stop-color="%230284c7" stop-opacity="0.6"/></linearGradient></defs><rect width="800" height="600" fill="url(%23bgG)"/><g transform="translate(100, 50)"><rect x="50" y="50" width="500" height="400" rx="6" fill="%231e293b" stroke="%2338bdf8" stroke-width="8"/><line x1="216" y1="50" x2="216" y2="450" stroke="%2338bdf8" stroke-width="6"/><line x1="382" y1="50" x2="382" y2="450" stroke="%2338bdf8" stroke-width="6"/><rect x="58" y="58" width="150" height="384" fill="url(%23glassG)" stroke="%2338bdf8" stroke-width="2"/><rect x="224" y="58" width="150" height="384" fill="url(%23glassG)" stroke="%2338bdf8" stroke-width="2"/><rect x="390" y="58" width="150" height="384" fill="url(%23glassG)" stroke="%2338bdf8" stroke-width="2"/><circle cx="200" cy="250" r="10" fill="%23f8fafc"/><circle cx="240" cy="250" r="10" fill="%23f8fafc"/><text x="300" y="490" fill="%23f8fafc" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" text-anchor="middle">تقفيل شرفة (بلكونة) قطاع جرار تركي مزدوج العزل</text></g></svg>`,
    `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%"><rect width="800" height="600" fill="%230f172a"/><defs><linearGradient id="bgG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231e293b"/><stop offset="100%" stop-color="%230f172a"/></linearGradient><linearGradient id="glassG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230ea5e9" stop-opacity="0.4"/><stop offset="100%" stop-color="%232563eb" stop-opacity="0.7"/></linearGradient></defs><rect width="800" height="600" fill="url(%23bgG)"/><g transform="translate(100, 50)"><rect x="50" y="50" width="500" height="400" rx="6" fill="%231e293b" stroke="%230ea5e9" stroke-width="8"/><line x1="300" y1="50" x2="300" y2="450" stroke="%230ea5e9" stroke-width="6"/><rect x="58" y="58" width="234" height="384" fill="url(%23glassG)" stroke="%230ea5e9" stroke-width="2"/><rect x="308" y="58" width="234" height="384" fill="url(%23glassG)" stroke="%230ea5e9" stroke-width="2"/><path d="M 120 120 L 220 120 L 220 220 Z" fill="%23ffffff" fill-opacity="0.1"/><path d="M 370 120 L 470 120 L 470 220 Z" fill="%23ffffff" fill-opacity="0.1"/><text x="300" y="490" fill="%230ea5e9" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" text-anchor="middle">بلكونة عريضة قطاع ألماني عازل تماماً للأتربة والمطر</text></g></svg>`,
    DEFAULT_IMAGES.gallerySample3
  ]
};
