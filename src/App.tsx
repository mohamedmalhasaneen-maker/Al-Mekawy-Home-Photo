import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  Unlock, 
  LogOut, 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Upload, 
  Image as ImageIcon, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Maximize2, 
  X, 
  Phone, 
  MapPin, 
  Shield, 
  Flame, 
  Wind, 
  Check,
  Building2,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Facebook,
  Instagram,
  Video,
  Calculator,
  Share2,
  Copy,
  Film,
  Play,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CatalogCategory, ProductSubtype, Advantage, MediaItem } from './types';
import { INITIAL_CATALOG, INITIAL_ADVANTAGES, DEFAULT_IMAGES, INITIAL_THREE_TAB_PHOTOS } from './data';
import { AlmekawyLogo } from './components/AlmekawyLogo';
import { 
  subscribeToMediaCollection, 
  isFirebaseConfigured, 
  uploadMediaToFirebase, 
  deleteMediaFromFirebase 
} from './lib/firebase';
import { FirebaseMediaManager } from './components/FirebaseMediaManager';

export default function App() {
  // ---- الحالات الخاصة بالتطبيق (State Management) ----
  const [catalog, setCatalog] = useState<CatalogCategory[]>(INITIAL_CATALOG);
  const [advantages, setAdvantages] = useState<Advantage[]>(INITIAL_ADVANTAGES);
  const [selectedCategoryId, setSelectedCategoryId] = useState<'doors' | 'windows' | null>(null);
  const [selectedSubtype, setSelectedSubtype] = useState<ProductSubtype | null>(null);
  
  // وسائط Firebase السحابية الدائمة (صور وفيديوهات)
  const [firebaseMedia, setFirebaseMedia] = useState<MediaItem[]>([]);

  // فئة معرض الصور الثلاثية المضافة حديثاً
  const [activeGalleryTab, setActiveGalleryTab] = useState<'doors' | 'windows' | 'balconies'>('doors');
  const [selectedSectionView, setSelectedSectionView] = useState<'doors' | 'windows' | 'balconies' | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<{
    doors: string[];
    windows: string[];
    balconies: string[];
  }>(INITIAL_THREE_TAB_PHOTOS);

  // حالات المشرف (Admin/Supervisor state)
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [showUploadMenu, setShowUploadMenu] = useState<boolean>(false);
  
  // حالات تصفح ومعاينة الصور (Lightbox / Fullscreen Gallery)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxSource, setLightboxSource] = useState<{
    type: 'custom' | 'catalog';
    tab?: 'doors' | 'windows' | 'balconies';
    categoryId?: string;
    subtypeId?: string;
  } | null>(null);
  
  // إشعارات التنبيه (Toast Notifications)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // معاينة تشغيل الفيديو بالحجم الكامل
  const [previewVideo, setPreviewVideo] = useState<{ url: string; title?: string; description?: string } | null>(null);
  // فلتر الوسائط في صفحة المعرض المنفصل (الكل / صور / فيديوهات)
  const [galleryMediaFilter, setGalleryMediaFilter] = useState<'all' | 'image' | 'video'>('all');

  // ---- سلايدر الصور التلقائي الرئيسي (Auto-playing Carousel Slider States & Logic) ----
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState<number>(0);
  const [isCarouselAutoplayPaused, setIsCarouselAutoplayPaused] = useState<boolean>(false);

  // تجميع صور وسائط السلايدر التفاعلي من Firebase والمعرض
  const carouselItems = React.useMemo(() => {
    const items: Array<{
      img: string;
      title: string;
      category: 'doors' | 'windows' | 'balconies';
      categoryLabel: string;
      description: string;
    }> = [];

    // 1. إعطاء الأولوية للصور المحفوظة في Firebase سحابياً
    if (firebaseMedia.length > 0) {
      const fbImages = firebaseMedia.filter(m => m.type === 'image');
      fbImages.forEach((m) => {
        const catLabel = m.category === 'doors' 
          ? "أبواب الـ PVC" 
          : m.category === 'windows' 
          ? "شبابيك الـ PVC" 
          : "تقفيل البلكونات";

        items.push({
          img: m.downloadURL,
          title: m.title || `مشروع ${catLabel} فاخر`,
          category: m.category,
          categoryLabel: catLabel,
          description: m.description || "قطاعات معززة وتصاميم فخمة مقاومة للرطوبة والمياه وعازلة للضوضاء والأتربة"
        });
      });
    }

    // 2. إضافة الصور من الكتالوج العام
    const maxLen = Math.max(
      galleryPhotos?.doors?.length || 0,
      galleryPhotos?.windows?.length || 0,
      galleryPhotos?.balconies?.length || 0
    );

    for (let i = 0; i < maxLen; i++) {
      if (galleryPhotos?.doors?.[i] && !items.some(x => x.img === galleryPhotos.doors[i])) {
        items.push({
          img: galleryPhotos.doors[i],
          title: i === 0 ? "أبواب الـ PVC المفصلية والجرارة الفاخرة" : `مشروع أبواب بي في سي متميز - رقم ${i + 1}`,
          category: 'doors',
          categoryLabel: "أبواب الـ PVC",
          description: "قطاعات معززة وتصاميم فخمة مقاومة للرطوبة والمياه وعازلة للضوضاء"
        });
      }
      if (galleryPhotos?.windows?.[i] && !items.some(x => x.img === galleryPhotos.windows[i])) {
        items.push({
          img: galleryPhotos.windows[i],
          title: i === 0 ? "شبابيك الـ PVC الألمانية والتركية دبل جلاس" : `مشروع شبابيك بي في سي عازلة - رقم ${i + 1}`,
          category: 'windows',
          categoryLabel: "شبابيك الـ PVC",
          description: "عزل صوتي وحراري كامل مع سدادات مزدوجة لمنع دخول الغبار بالكامل"
        });
      }
      if (galleryPhotos?.balconies?.[i] && !items.some(x => x.img === galleryPhotos.balconies[i])) {
        items.push({
          img: galleryPhotos.balconies[i],
          title: i === 0 ? "تقفيل بلكونات وشرفات الـ PVC بأعلى دقة" : `مشروع تقفيل شرفة بي في سي - رقم ${i + 1}`,
          category: 'balconies',
          categoryLabel: "تقفيل البلكونات",
          description: "مساحات معيشة هادئة وعصرية محمية تماماً من الرياح والأمطار والأتربة"
        });
      }
    }

    // إذا لم يكن هناك صور، نضع صورًا افتراضية
    if (items.length === 0) {
      items.push(
        {
          img: DEFAULT_IMAGES.doorSliding,
          title: "أبواب الـ PVC المفصلية والجرارة الفاخرة",
          category: 'doors',
          categoryLabel: "أبواب الـ PVC",
          description: "قطاعات معززة وتصاميم فخمة مقاومة للرطوبة والمياه وعازلة للضوضاء"
        },
        {
          img: DEFAULT_IMAGES.windowGerman,
          title: "شبابيك الـ PVC الألمانية والتركية دبل جلاس",
          category: 'windows',
          categoryLabel: "شبابيك الـ PVC",
          description: "عزل صوتي وحراري كامل مع سدادات مزدوجة لمنع دخول الغبار بالكامل"
        },
        {
          img: INITIAL_THREE_TAB_PHOTOS.balconies[0],
          title: "تقفيل بلكونات وشرفات الـ PVC بأعلى دقة",
          category: 'balconies',
          categoryLabel: "تقفيل البلكونات",
          description: "مساحات معيشة هادئة وعصرية محمية تماماً من الرياح والأمطار والأتربة"
        }
      );
    }

    return items;
  }, [galleryPhotos, firebaseMedia]);

  // ---- الاستماع الحي والمباشر لملفات Firebase Storage وقاعدة بيانات Firestore السحابية ----
  useEffect(() => {
    const unsubscribe = subscribeToMediaCollection(
      (items) => {
        setFirebaseMedia(items);
      },
      (error) => {
        console.warn("Notice: Firebase live subscription waiting for connection:", error.message);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // تأثير التدوير التلقائي للسلايدر
  useEffect(() => {
    if (isCarouselAutoplayPaused || carouselItems.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentCarouselIndex((prev) => (prev + 1) % carouselItems.length);
    }, 4500); // كل 4.5 ثانية

    return () => clearInterval(interval);
  }, [isCarouselAutoplayPaused, carouselItems.length]);

  // ملفات الرفع المخفية (Refs for hidden file inputs)
  const categoryFileInputRef = useRef<HTMLInputElement>(null);
  const subtypeCoverFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const customGalleryInputRef = useRef<HTMLInputElement>(null);

  // لحفظ المستهدف الحالي عند الرفع
  const [uploadContext, setUploadContext] = useState<{
    type: 'category' | 'subtype-cover' | 'gallery-add';
    categoryId?: string;
    subtypeId?: string;
  } | null>(null);

  // ---- استرجاع وحفظ البيانات من الخادم و LocalStorage ----
  useEffect(() => {
    const fetchLatestDataFromServer = async (isInitialCall = false) => {
      // 1. استرجاع صور المعرض من الخادم
      try {
        const res = await fetch('/api/gallery');
        const json = await res.json();
        if (json.success && json.data) {
          setGalleryPhotos(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(json.data)) {
              return json.data;
            }
            return prev;
          });
        } else if (isInitialCall) {
          const savedGalleryPhotos = localStorage.getItem('al_mekawy_three_tab_gallery_v1');
          if (savedGalleryPhotos) {
            setGalleryPhotos(JSON.parse(savedGalleryPhotos));
          }
        }
      } catch (e) {
        if (isInitialCall) {
          console.error("Error loading gallery from server:", e);
          const savedGalleryPhotos = localStorage.getItem('al_mekawy_three_tab_gallery_v1');
          if (savedGalleryPhotos) {
            setGalleryPhotos(JSON.parse(savedGalleryPhotos));
          }
        }
      }

      // 2. استرجاع الكتالوج من الخادم
      try {
        const res = await fetch('/api/catalog');
        const json = await res.json();
        if (json.success && json.data) {
          setCatalog(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(json.data)) {
              return json.data;
            }
            return prev;
          });
        } else if (isInitialCall) {
          const savedCatalog = localStorage.getItem('al_mekawy_catalog_v1');
          if (savedCatalog) {
            setCatalog(JSON.parse(savedCatalog));
          }
        }
      } catch (e) {
        if (isInitialCall) {
          console.error("Error loading catalog from server:", e);
          const savedCatalog = localStorage.getItem('al_mekawy_catalog_v1');
          if (savedCatalog) {
            setCatalog(JSON.parse(savedCatalog));
          }
        }
      }
    };

    const loadServerAndLocalData = async () => {
      // استرجاع حالة تسجيل المشرف من الذاكرة المحلية
      try {
        const savedAdminState = localStorage.getItem('al_mekawy_admin_logged');
        if (savedAdminState === 'true') {
          setIsAdmin(true);
        }
      } catch (e) {
        console.error("Error reading admin state:", e);
      }

      // تحميل البيانات لأول مرة
      await fetchLatestDataFromServer(true);
    };

    loadServerAndLocalData();

    // إعداد فحص دوري ذكي وتلقائي كل 4 ثوانٍ للتأكد من المزامنة الفورية لجميع الزوار
    const intervalId = setInterval(() => {
      fetchLatestDataFromServer(false);
    }, 4000);

    return () => clearInterval(intervalId);
  }, []);

  // مزامنة حالة القطاع المفتوح حالياً عند حدوث أي تعديل للكتالوج قادم من الخادم
  useEffect(() => {
    if (selectedSubtype) {
      for (const category of catalog) {
        const foundSubtype = category.subtypes.find(s => s.id === selectedSubtype.id);
        if (foundSubtype) {
          if (JSON.stringify(foundSubtype) !== JSON.stringify(selectedSubtype)) {
            setSelectedSubtype(foundSubtype);
          }
          break;
        }
      }
    }
  }, [catalog, selectedSubtype]);

  const saveCatalogState = async (newCatalog: CatalogCategory[]) => {
    setCatalog(newCatalog);
    try {
      localStorage.setItem('al_mekawy_catalog_v1', JSON.stringify(newCatalog));
    } catch (e) {
      console.error("Error saving to localStorage:", e);
      showToast('⚠️ تعذر الحفظ التلقائي المحلي: قد تكون مساحة الصور المرفوعة كبيرة جداً.', 'error');
    }

    try {
      const res = await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ catalog: newCatalog })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setCatalog(json.data);
        try {
          localStorage.setItem('al_mekawy_catalog_v1', JSON.stringify(json.data));
        } catch (e) {
          console.error("Error saving to localStorage:", e);
        }
      }
    } catch (e) {
      console.error("Error saving catalog to server:", e);
      showToast('⚠️ تعذر حفظ التعديلات على الخادم الرئيسي، تم الحفظ محلياً فقط.', 'error');
    }
  };

  const saveGalleryPhotosState = async (newPhotos: { doors: string[]; windows: string[]; balconies: string[] }) => {
    setGalleryPhotos(newPhotos);
    try {
      localStorage.setItem('al_mekawy_three_tab_gallery_v1', JSON.stringify(newPhotos));
    } catch (e) {
      console.error("Error saving gallery photos to localStorage:", e);
      showToast('⚠️ تعذر حفظ الصور الجديدة في الذاكرة التلقائية المحلية.', 'error');
    }

    try {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos: newPhotos })
      });
      const json = await res.json();
      if (json.success) {
        if (json.data) {
          setGalleryPhotos(json.data);
          try {
            localStorage.setItem('al_mekawy_three_tab_gallery_v1', JSON.stringify(json.data));
          } catch (e) {
            console.error("Error saving gallery photos to localStorage:", e);
          }
        }
        showToast('✅ تم حفظ الصور ونشرها بنجاح للجميع على الخادم!', 'success');
      } else {
        showToast('⚠️ تم الحفظ محلياً وتعذر النشر على الخادم.', 'info');
      }
    } catch (e) {
      console.error("Error saving gallery to server:", e);
      showToast('⚠️ تعذر حفظ الصور على الخادم الرئيسي، تم الحفظ محلياً فقط.', 'error');
    }
  };

  // ---- دالة لعرض الإشعارات اللطيفة ----
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // ---- التعامل مع كلمة مرور المشرف ----
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // كلمة المرور الافتراضية بسيطة وسهلة الفهم للمستخدم العربي
    if (passwordInput === '662006' || passwordInput.toLowerCase() === 'admin') {
      setIsAdmin(true);
      localStorage.setItem('al_mekawy_admin_logged', 'true');
      setShowLoginModal(false);
      setPasswordInput('');
      setLoginError('');
      showToast('🔒 تم تسجيل دخول المشرف بنجاح! يمكنك الآن تعديل ورفع أي صور مباشرة.', 'success');
    } else {
      setLoginError('كلمة المرور غير صحيحة! يرجى المحاولة مرة أخرى (كلمة المرور: 662006)');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('al_mekawy_admin_logged');
    setShowAdminPanel(false);
    showToast('🔓 تم تسجيل الخروج من وضع المشرف وتأمين الموقع.', 'info');
  };

  // ---- مشاركة الصور عبر الشبكات الاجتماعية ونظام نسخ الروابط ----
  const handleShare = async (imgUrl: string, platform: 'whatsapp' | 'facebook' | 'copy' | 'download_share', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    const isDataUrl = imgUrl.startsWith('data:');
    const shareUrl = isDataUrl ? window.location.href : (imgUrl.startsWith('http') ? imgUrl : window.location.origin + imgUrl);
    const shareText = `شاهد هذا العمل المميز من شركة المكاوي هوم لأعمال الـ UPVC والشبابيك والأبواب:\n${shareUrl}`;

    if (platform === 'copy') {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('📋 تم نسخ رابط الصورة بنجاح إلى الحافظة!', 'success');
      }).catch(() => {
        showToast('❌ عذراً، لم نتمكن من نسخ الرابط.', 'error');
      });
      return;
    }

    if (platform === 'whatsapp') {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, '_blank');
      showToast('📲 جاري فتح واتساب للمشاركة المباشرة...', 'success');
      return;
    }

    if (platform === 'facebook') {
      const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
      window.open(fbUrl, '_blank');
      showToast('🌐 جاري فتح فيسبوك للمشاركة المباشرة...', 'success');
      return;
    }

    // للمشاركة عبر تنزيل الملف (download_share)
    showToast('⏳ جاري إعداد الصورة للتحميل والمشاركة المباشرة...', 'info');

    try {
      let blob: Blob;
      if (isDataUrl) {
        // إذا كانت الصورة base64 نقوم بتحويلها إلى Blob
        const parts = imgUrl.split(';base64,');
        const contentType = parts[0].split(':')[1];
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        blob = new Blob([uInt8Array], { type: contentType });
      } else {
        // جلب ملف الصورة من الرابط (روابط Cloudinary أو الروابط المحلية)
        const response = await fetch(imgUrl);
        blob = await response.blob();
      }

      const mimeType = blob.type || 'image/jpeg';
      const extension = mimeType.split('/')[1] || 'jpg';
      const fileName = `al_mekawy_upvc_${Date.now()}.${extension}`;
      const file = new File([blob], fileName, { type: mimeType });
      const objectUrl = window.URL.createObjectURL(blob);

      // تحميل الصورة فورياً على جهاز المستخدم
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = objectUrl;
      downloadAnchor.download = fileName;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      window.URL.revokeObjectURL(objectUrl);

      // محاولة مشاركة الصورة الفعلية كملف باستخدام Web Share API في الهواتف الذكية والأجهزة المتوافقة
      if (platform === 'download_share') {
        if (navigator.share && navigator.canShare) {
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'شركة المكاوي UPVC',
              text: 'شاهد هذا العمل المميز من شركة المكاوي هوم لأعمال الـ UPVC والشبابيك والأبواب'
            });
            showToast('✅ تم تحميل الصورة وفتح خيارات المشاركة بنجاح!', 'success');
            return;
          }
        }
        showToast('📥 تم تحميل وحفظ الصورة على جهازك بنجاح!', 'success');
        return;
      }

    } catch (error) {
      console.error("Error fetching or sharing image file:", error);
      // طريقة احتياطية بسيطة في حال فشل fetch أو التحويل
      try {
        const downloadAnchor = document.createElement('a');
        downloadAnchor.href = imgUrl;
        downloadAnchor.target = '_blank';
        downloadAnchor.download = `al_mekawy_upvc_${Date.now()}.jpg`;
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        document.body.removeChild(downloadAnchor);
        showToast('📥 تم فتح وتحميل الصورة بنجاح.', 'success');
      } catch (innerError) {
        showToast('❌ عذراً، تعذر تنزيل الصورة.', 'error');
      }
    }
  };

  // ---- معالجة وضغط الصور على المتصفح (HTML5 Canvas Compression) ----
  // هذه ميزة احترافية جداً تمنع امتلاء مساحة الـ LocalStorage عن طريق تصغير وضغط الصور المرفوعة تلقائياً
  const processAndCompressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('الملف المرفوع ليس صورة صالحة!'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // أقصى أبعاد مسموحة للصور (مثالية للعرض وسريعة التحميل)
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('تعذر معالجة محرك الرسم الثنائي الأبعاد'));
            return;
          }

          // خلفية بيضاء في حال كانت الصورة شفافة ونريد ضغطها كـ JPEG
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          
          ctx.drawImage(img, 0, 0, width, height);

          // تصدير الصورة بجودة مضغوطة 60% للحفاظ على مساحة التخزين وسرعة التصفح وتجنب مشاكل الشبكة
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error('فشل تحميل محتوى الصورة المحددة'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('فشل قراءة الملف من الجهاز'));
      reader.readAsDataURL(file);
    });
  };

  // ---- تفعيل رفع الملفات ----
  const triggerImageUpload = (
    type: 'category' | 'subtype-cover' | 'gallery-add', 
    categoryId?: string, 
    subtypeId?: string
  ) => {
    if (!isAdmin) {
      setShowLoginModal(true);
      return;
    }
    setUploadContext({ type, categoryId, subtypeId });
    
    // تأخير طفيف لضمان تحديث الـ context
    setTimeout(() => {
      if (type === 'category' && categoryFileInputRef.current) {
        categoryFileInputRef.current.click();
      } else if (type === 'subtype-cover' && subtypeCoverFileInputRef.current) {
        subtypeCoverFileInputRef.current.click();
      } else if (type === 'gallery-add' && galleryFileInputRef.current) {
        galleryFileInputRef.current.click();
      }
    }, 50);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !uploadContext) return;

    const fileList = Array.from(files) as File[];

    if (fileList.length > 1) {
      showToast(`⏳ جاري معالجة ورفع ${fileList.length} من الصور بسرعة فائقة...`, 'info');
    } else {
      showToast('⏳ جاري المعالجة والرفع السحابي الفوري...', 'info');
    }

    try {
      // 1. في حال كان Firebase مهيئاً، نرفع الصور مباشرة إلى Firebase Storage بالتوازي لسرعة خارقة
      let finalImages: string[] = [];
      if (isFirebaseConfigured()) {
        const cat = uploadContext.categoryId === 'doors' ? 'doors' : 'windows';
        const uploadPromises = fileList.map(async (file) => {
          try {
            const cleanTitle = file.name.substring(0, file.name.lastIndexOf('.')) || 'صورة مشروع';
            const uploadedItem = await uploadMediaToFirebase(file, {
              title: cleanTitle,
              description: `صورة قطاع من كتالوج شركة المكاوي UPVC`,
              category: cat,
            });
            return uploadedItem.downloadURL;
          } catch (fbErr) {
            console.warn("Firebase upload fallback to compressed base64:", fbErr);
            return await processAndCompressImage(file);
          }
        });

        const settled = await Promise.allSettled(uploadPromises);
        finalImages = settled
          .filter(r => r.status === 'fulfilled')
          .map(r => (r as PromiseFulfilledResult<string>).value);
      } else {
        // ضغط ومعالجة محلي في حال عدم وجود إعدادات Firebase
        const results = await Promise.allSettled(
          fileList.map(file => processAndCompressImage(file))
        );
        finalImages = results
          .filter(r => r.status === 'fulfilled')
          .map(r => (r as PromiseFulfilledResult<string>).value);
      }

      if (finalImages.length === 0) {
        showToast('❌ لم يتم بنجاح معالجة أو رفع أي صورة من الملفات المحددة.', 'error');
        return;
      }

      const updatedCatalog = [...catalog];

      if (uploadContext.type === 'category' && uploadContext.categoryId) {
        // تحديث صورة القسم الرئيسي (Doors or Windows)
        const catIdx = updatedCatalog.findIndex(c => c.id === uploadContext.categoryId);
        if (catIdx !== -1) {
          updatedCatalog[catIdx].image = finalImages[0];
          saveCatalogState(updatedCatalog);
          showToast('📸 تم حفظ وتحديث غلاف القسم بنجاح!', 'success');
        }
      } 
      else if (uploadContext.type === 'subtype-cover' && uploadContext.categoryId && uploadContext.subtypeId) {
        // تحديث صورة الغلاف لقطاع فرعي معين
        const catIdx = updatedCatalog.findIndex(c => c.id === uploadContext.categoryId);
        if (catIdx !== -1) {
          const subIdx = updatedCatalog[catIdx].subtypes.findIndex(s => s.id === uploadContext.subtypeId);
          if (subIdx !== -1) {
            updatedCatalog[catIdx].subtypes[subIdx].image = finalImages[0];
            
            // تحديث الضلفة المعروضة حالياً إن وجدت لتحديث فوري
            if (selectedSubtype && selectedSubtype.id === uploadContext.subtypeId) {
              setSelectedSubtype({ ...selectedSubtype, image: finalImages[0] });
            }
            
            saveCatalogState(updatedCatalog);
            showToast('📸 تم حفظ وتحديث غلاف القطاع بنجاح!', 'success');
          }
        }
      } 
      else if (uploadContext.type === 'gallery-add' && uploadContext.categoryId && uploadContext.subtypeId) {
        // إضافة صور جديدة لمعرض الأعمال المنفذة (دعم صور متعددة دفعة واحدة)
        const catIdx = updatedCatalog.findIndex(c => c.id === uploadContext.categoryId);
        if (catIdx !== -1) {
          const subIdx = updatedCatalog[catIdx].subtypes.findIndex(s => s.id === uploadContext.subtypeId);
          if (subIdx !== -1) {
            if (!updatedCatalog[catIdx].subtypes[subIdx].gallery) {
              updatedCatalog[catIdx].subtypes[subIdx].gallery = [];
            }
            updatedCatalog[catIdx].subtypes[subIdx].gallery.push(...finalImages);
            
            // تحديث الضلفة المعروضة حالياً لتحديث فوري للمعرض المفتوح أمام المستخدم
            if (selectedSubtype && selectedSubtype.id === uploadContext.subtypeId) {
              setSelectedSubtype({ 
                ...selectedSubtype, 
                gallery: [...(selectedSubtype.gallery || []), ...finalImages] 
              });
            }

            saveCatalogState(updatedCatalog);
            if (finalImages.length > 1) {
              showToast(`✅ تم حفظ ${finalImages.length} صور في السحابة وإضافتها لمعرض القطاع بنجاح!`, 'success');
            } else {
              showToast('✅ تم حفظ الصورة وإضافتها لمعرض القطاع بنجاح!', 'success');
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      showToast('❌ حدث خطأ أثناء معالجة الصور، يرجى التأكد من اختيار ملفات صور صالحة.', 'error');
    } finally {
      e.target.value = '';
      setUploadContext(null);
    }
  };

  // ---- حذف صورة من معرض الأعمال ----
  const handleDeleteGalleryImage = (imageIndex: number, categoryId: string, subtypeId: string) => {
    if (!isAdmin) {
      showToast('⚠️ غير مسموح بالحذف إلا للمشرف فقط', 'error');
      return;
    }
    const updatedCatalog = [...catalog];
    const catIdx = updatedCatalog.findIndex(c => c.id === categoryId);
    if (catIdx !== -1) {
      const subIdx = updatedCatalog[catIdx].subtypes.findIndex(s => s.id === subtypeId);
      if (subIdx !== -1) {
        updatedCatalog[catIdx].subtypes[subIdx].gallery.splice(imageIndex, 1);
        
        // تحديث الواجهة التفاعلية فوراً
        if (selectedSubtype && selectedSubtype.id === subtypeId) {
          const newGallery = [...selectedSubtype.gallery];
          newGallery.splice(imageIndex, 1);
          setSelectedSubtype({ ...selectedSubtype, gallery: newGallery });
        }

        saveCatalogState(updatedCatalog);
        showToast('🗑️ تم حذف الصورة من المعرض بنجاح.', 'success');
      }
    }
  };

  // ---- إدارة وتأمين معرض الصور الحصري الثلاثي الجديد (الأبواب، الشبابيك، البلكونات) ----
  const triggerCustomGalleryUpload = (tab: 'doors' | 'windows' | 'balconies') => {
    if (!isAdmin) {
      setShowLoginModal(true);
      return;
    }
    setActiveGalleryTab(tab);
    if (customGalleryInputRef.current) {
      customGalleryInputRef.current.click();
    }
  };

  const handleCustomGalleryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files) as File[];

    // 1. في حال كان Firebase مهيأً، يتم الرفع السحابي فائق السرعة والمباشر بالتوازي (Parallel Upload)
    if (isFirebaseConfigured()) {
      showToast(`⚡ جاري رفع ${fileList.length} ملف تلقائياً إلى سحابة Firebase...`, 'info');
      try {
        const catLabel = activeGalleryTab === 'doors' ? 'أبواب' : activeGalleryTab === 'windows' ? 'شبابيك' : 'بلكونات';
        
        // تنفيذ الرفع بالتوازي لسرعة قصوى وسلاسة تامة
        const uploadPromises = fileList.map(async (file) => {
          const cleanTitle = file.name.substring(0, file.name.lastIndexOf('.')) || `مشروع ${catLabel}`;
          return await uploadMediaToFirebase(file, {
            title: cleanTitle,
            description: `تم الرفع التلقائي لقسم ${catLabel} بشركة المكاوي UPVC`,
            category: activeGalleryTab,
          });
        });

        const results = await Promise.allSettled(uploadPromises);
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failedCount = results.filter(r => r.status === 'rejected').length;

        if (successCount > 0) {
          showToast(
            `✅ تم رفع وحفظ ${successCount} ${successCount > 1 ? 'ملفات' : 'ملف'} تلقائياً على Firebase بنجاح وسرعة فائقة!`,
            'success'
          );
        }
        if (failedCount > 0) {
          showToast(`⚠️ تعذر رفع ${failedCount} ملف، يرجى التأكد من استقرار الاتصال.`, 'error');
        }
      } catch (fbErr: any) {
        console.error("Firebase direct upload error:", fbErr);
        showToast(`❌ تعذر الرفع لـ Firebase: ${fbErr.message || fbErr}`, 'error');
      } finally {
        e.target.value = '';
      }
      return;
    }

    // 2. إذا لم تكن مفاتيح Firebase مهيأة في متغيرات البيئة بعد:
    const hasVideo = fileList.some(f => f.type.startsWith('video/'));
    if (hasVideo) {
      showToast('⚠️ رفع الفيديوهات يتطلب إعداد مفاتيح Firebase السحابية، يرجى ضبطها لحفظ الفيديوهات.', 'error');
    }

    const imageFiles = fileList.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      e.target.value = '';
      return;
    }

    if (imageFiles.length > 1) {
      showToast(`⚡ جاري معالجة وضغط ${imageFiles.length} من الصور بسرعة...`, 'info');
    } else {
      showToast('⚡ جاري معالجة وضغط الصورة المرفوعة...', 'info');
    }

    try {
      const results = await Promise.allSettled(
        imageFiles.map(file => processAndCompressImage(file))
      );

      const base64Images = results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<string>).value);

      if (base64Images.length === 0) {
        showToast('❌ لم يتم بنجاح معالجة أو ضغط أي صورة من الملفات المحددة.', 'error');
        return;
      }

      const updatedPhotos = { ...galleryPhotos };
      updatedPhotos[activeGalleryTab] = [...updatedPhotos[activeGalleryTab], ...base64Images];
      
      saveGalleryPhotosState(updatedPhotos);
      if (base64Images.length > 1) {
        showToast(`✅ تم إضافة ${base64Images.length} صور لمعرض الأعمال بنجاح!`, 'success');
      } else {
        showToast('✅ تم إضافة الصورة لمعرض الأعمال بنجاح!', 'success');
      }
    } catch (error) {
      console.error(error);
      showToast('❌ حدث خطأ أثناء معالجة الصور، يرجى المحاولة مرة أخرى.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  // حذف ملف وسائط من Firebase Storage و Firestore للمشرف فقط
  const handleDeleteFirebaseMedia = async (item: MediaItem) => {
    if (!isAdmin) {
      showToast('⚠️ غير مسموح بالحذف إلا للمشرف فقط', 'error');
      return;
    }
    if (!confirm(`هل أنت متأكد من حذف ${item.type === 'video' ? 'الفيديو' : 'الصورة'} "${item.title || item.name}" نهائياً من سحابة Firebase؟`)) {
      return;
    }
    try {
      showToast('⏳ جاري الحذف من Firebase Storage و Firestore...', 'info');
      await deleteMediaFromFirebase(item);
      showToast('🗑️ تم حذف الملف نهائياً من السحابة.', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(`❌ تعذر الحذف من Firebase: ${err.message || err}`, 'error');
    }
  };

  const handleDeleteCustomGalleryImage = (tab: 'doors' | 'windows' | 'balconies', index: number) => {
    if (!isAdmin) {
      showToast('⚠️ غير مسموح بالحذف إلا للمشرف فقط', 'error');
      return;
    }
    const updatedPhotos = { ...galleryPhotos };
    updatedPhotos[tab] = updatedPhotos[tab].filter((_, idx) => idx !== index);
    saveGalleryPhotosState(updatedPhotos);
    showToast('🗑️ تم حذف الصورة بنجاح من المعرض.', 'success');
  };

  // ---- استعادة الإعدادات والكتالوج المصنعي الأصلي ----
  const handleResetCatalog = async () => {
    if (confirm('🚨 انتبه! هذا الإجراء سيقوم بحذف جميع الصور والتعديلات التي قام بها المشرف واستعادة صور وعناصر الكتالوج الافتراضية بالكامل. هل تريد الاستمرار؟')) {
      await saveCatalogState(INITIAL_CATALOG);
      await saveGalleryPhotosState(INITIAL_THREE_TAB_PHOTOS);
      localStorage.removeItem('al_mekawy_catalog_v1');
      localStorage.removeItem('al_mekawy_three_tab_gallery_v1');
      setSelectedCategoryId(null);
      setSelectedSubtype(null);
      showToast('🔄 تم تصفير الكتالوج واستعادة الصور والتكوينات الافتراضية للموقع.', 'info');
    }
  };

  // ---- تصدير بيانات الكتالوج بالكامل كملف JSON لتأمينها ----
  const handleExportData = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(catalog, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "Al_Mekawy_UPVC_Catalog_Backup.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('📥 تم تحميل ملف نسخة احتياطية للكتالوج بنجاح! احتفظ به لاستعادته في أي وقت.', 'success');
    } catch (e) {
      showToast('❌ تعذر تصدير البيانات للنسخة الاحتياطية.', 'error');
    }
  };

  // ---- استيراد بيانات الكتالوج بالكامل من ملف JSON خارجي ----
  const handleImportClick = () => {
    if (importFileInputRef.current) {
      importFileInputRef.current.click();
    }
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].subtypes) {
          saveCatalogState(parsed);
          setSelectedCategoryId(null);
          setSelectedSubtype(null);
          showToast('⚡ تم استيراد وتحميل النسخة الاحتياطية وتحديث كافة الصور والقطاعات بنجاح!', 'success');
        } else {
          showToast('❌ بنية ملف النسخ الاحتياطي غير صالحة ولا تتطابق مع كتالوج المكاوي.', 'error');
        }
      } catch (err) {
        showToast('❌ حدث خطأ في قراءة ملف الـ JSON المرفوع.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // تفريغ المدخل
  };

  // ---- التنقل السلس بين الأقسام والقطاعات ----
  const handleSelectCategory = (categoryId: 'doors' | 'windows') => {
    setSelectedCategoryId(categoryId);
    setSelectedSubtype(null); // إعادة تعيين أي قطاع مفتوح
    
    // سكرول لطيف لأعلى منطقة المنتجات
    const el = document.getElementById('catalog-explore-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGoBackToMain = () => {
    setSelectedCategoryId(null);
    setSelectedSubtype(null);
  };

  const handleSelectSubtype = (subtype: ProductSubtype) => {
    setSelectedSubtype(subtype);
    // فتح معرض الصور الخاص به فوراً للمعاينة
    const el = document.getElementById('subtype-details-container');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // ---- فتح وعرض نافذة معاينة الصور الكبيرة (Lightbox) ----
  const openLightbox = (
    images: string[], 
    index: number, 
    source?: {
      type: 'custom' | 'catalog';
      tab?: 'doors' | 'windows' | 'balconies';
      categoryId?: string;
      subtypeId?: string;
    }
  ) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    if (source) {
      setLightboxSource(source);
    } else {
      setLightboxSource(null);
    }
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
    setLightboxSource(null);
  };

  const handleDeleteFromLightbox = () => {
    if (lightboxIndex === null || !lightboxSource) return;

    if (!isAdmin) {
      showToast('⚠️ غير مسموح بالحذف إلا للمشرف فقط', 'error');
      return;
    }

    const { type, tab, categoryId, subtypeId } = lightboxSource;
    const indexToDelete = lightboxIndex;

    if (type === 'custom' && tab) {
      const updatedPhotos = { ...galleryPhotos };
      updatedPhotos[tab] = updatedPhotos[tab].filter((_, idx) => idx !== indexToDelete);
      
      const newImages = [...lightboxImages];
      newImages.splice(indexToDelete, 1);
      setLightboxImages(newImages);

      saveGalleryPhotosState(updatedPhotos);
      showToast('🗑️ تم حذف الصورة بنجاح من المعرض.', 'success');

      if (newImages.length === 0) {
        closeLightbox();
      } else {
        setLightboxIndex(Math.min(indexToDelete, newImages.length - 1));
      }
    } else if (type === 'catalog' && categoryId && subtypeId) {
      const updatedCatalog = [...catalog];
      const catIdx = updatedCatalog.findIndex(c => c.id === categoryId);
      if (catIdx !== -1) {
        const subIdx = updatedCatalog[catIdx].subtypes.findIndex(s => s.id === subtypeId);
        if (subIdx !== -1) {
          updatedCatalog[catIdx].subtypes[subIdx].gallery.splice(indexToDelete, 1);

          if (selectedSubtype && selectedSubtype.id === subtypeId) {
            const newGallery = [...selectedSubtype.gallery];
            newGallery.splice(indexToDelete, 1);
            setSelectedSubtype({ ...selectedSubtype, gallery: newGallery });
          }

          const newImages = [...lightboxImages];
          newImages.splice(indexToDelete, 1);
          setLightboxImages(newImages);

          saveCatalogState(updatedCatalog);
          showToast('🗑️ تم حذف الصورة من المعرض بنجاح.', 'success');

          if (newImages.length === 0) {
            closeLightbox();
          } else {
            setLightboxIndex(Math.min(indexToDelete, newImages.length - 1));
          }
        }
      }
    }
  };

  const navigateLightbox = (direction: 'next' | 'prev') => {
    if (lightboxIndex === null || lightboxImages.length <= 1) return;
    
    let newIdx = lightboxIndex;
    if (direction === 'next') {
      newIdx = (lightboxIndex + 1) % lightboxImages.length;
    } else {
      newIdx = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
    }
    setLightboxIndex(newIdx);
  };

  // القسم المحدد حالياً
  const currentCategory = catalog.find(c => c.id === selectedCategoryId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-sky-500 selection:text-white font-sans antialiased pb-20">
      
      {/* ---- شريط تنبيهات المشرف العلوي في حال تفعيل وضع التعديل ---- */}
      {isAdmin && (
        <div className="sticky top-0 z-50 bg-gradient-to-r from-sky-600 via-sky-700 to-sky-800 text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-semibold">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span>أنت الآن في وضع "المشرف المعتمد" لشركة المكاوى UPVC</span>
            </div>
            
            <div className="flex items-center gap-3 relative">
              <div className="relative">
                <button 
                  onClick={() => setShowUploadMenu(!showUploadMenu)} 
                  className="bg-white hover:bg-sky-50 text-sky-700 font-extrabold text-xs px-3.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-sm hover:scale-102 active:scale-98"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>رفع وتحديث صور للموقع 📤</span>
                </button>

                <AnimatePresence>
                  {showUploadMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden text-slate-800"
                    >
                      <div className="p-2 border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
                        اختر المعرض المراد الرفع إليه:
                      </div>
                      <div className="flex flex-col p-1.5 gap-1 text-right font-sans">
                        <button
                          type="button"
                          onClick={() => {
                            setShowUploadMenu(false);
                            triggerCustomGalleryUpload('doors');
                          }}
                          className="w-full text-right px-3 py-2 rounded-lg text-xs font-bold hover:bg-sky-50 hover:text-sky-700 transition-colors cursor-pointer flex items-center justify-between"
                        >
                          <span>🚪 معرض الأبواب الـ PVC</span>
                          <span className="text-[10px] text-slate-400 font-mono">({galleryPhotos.doors.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowUploadMenu(false);
                            triggerCustomGalleryUpload('windows');
                          }}
                          className="w-full text-right px-3 py-2 rounded-lg text-xs font-bold hover:bg-sky-50 hover:text-sky-700 transition-colors cursor-pointer flex items-center justify-between"
                        >
                          <span>🪟 معرض الشبابيك الـ PVC</span>
                          <span className="text-[10px] text-slate-400 font-mono">({galleryPhotos.windows.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowUploadMenu(false);
                            triggerCustomGalleryUpload('balconies');
                          }}
                          className="w-full text-right px-3 py-2 rounded-lg text-xs font-bold hover:bg-sky-50 hover:text-sky-700 transition-colors cursor-pointer flex items-center justify-between"
                        >
                          <span>🏡 معرض البلكونات</span>
                          <span className="text-[10px] text-slate-400 font-mono">({galleryPhotos.balconies.length})</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={() => setShowAdminPanel(!showAdminPanel)} 
                className="bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors font-bold"
                title="لوحة البيانات والنسخ الاحتياطي"
              >
                ⚙️ الإعدادات
              </button>
              
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg text-white cursor-pointer transition-colors text-xs font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج المشرف</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- لوحة تحكم المشرف لإدارة وتأمين الصور وقاعدة البيانات ---- */}
      <AnimatePresence>
        {isAdmin && showAdminPanel && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white border-b border-sky-100 shadow-inner overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="text-sky-600 w-5 h-5" />
                    لوحة تحكم وتأمين وسائط شركة المكاوى UPVC
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    يتم حفظ ومزامنة كافة الصور تلقائياً في سحابة Firebase Storage لتظهر فوراً لجميع الأجهزة والزوار.
                  </p>
                </div>
              </div>

              {/* أدوات النسخ الاحتياطي وإدارة الملفات */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 1. التصدير */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-sky-300 transition-colors">
                    <h4 className="font-bold text-sm text-slate-900 mb-2 flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-sky-600" />
                      تنزيل نسخة احتياطية (تصدير)
                    </h4>
                    <p className="text-xs text-slate-500 mb-3">
                      تحميل كافة تعديلاتك وصور أعمالك التي رفعتها في ملف واحد لحمايتها من الضياع في حال مسح ذاكرة المتصفح.
                    </p>
                    <button 
                      onClick={handleExportData}
                      className="w-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors cursor-pointer"
                    >
                      تصدير الكتالوج بالكامل كـ JSON
                    </button>
                  </div>

                  {/* 2. الاستيراد */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-sky-300 transition-colors">
                    <h4 className="font-bold text-sm text-slate-900 mb-2 flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-sky-600" />
                      تحميل واستعادة نسخة احتياطية (استيراد)
                    </h4>
                    <p className="text-xs text-slate-500 mb-3">
                      استيراد ملف كتالوج خارجي واسترجاع كافة صور أعمالك وقوائمك التي قمت بإنشائها مسبقاً وتعديلها.
                    </p>
                    <button 
                      onClick={handleImportClick}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors cursor-pointer"
                    >
                      استيراد ملف كتالوج JSON
                    </button>
                    <input 
                      type="file" 
                      ref={importFileInputRef} 
                      onChange={handleImportFileChange} 
                      accept=".json" 
                      className="hidden" 
                    />
                  </div>

                  {/* 3. استعادة الافتراضي */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-red-200 transition-colors">
                    <h4 className="font-bold text-sm text-slate-900 mb-2 flex items-center gap-1.5">
                      <RefreshCw className="w-4 h-4 text-red-500" />
                      تصفير واستعادة المصنع
                    </h4>
                    <p className="text-xs text-slate-500 mb-3">
                      حذف كافة صور المعارض والمشاريع التي قمت برفعها بشكل دائم واسترجاع الرسوم المخططة الافتراضية للكتالوج.
                    </p>
                    <button 
                      onClick={handleResetCatalog}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold py-2 px-3 rounded-lg transition-colors cursor-pointer"
                    >
                      استعادة الكتالوج الافتراضي ⚠️
                    </button>
                  </div>
                </div>

                {/* إدارة ومراجعة وسائط السحابة */}
                <div className="border-t border-slate-200 pt-6">
                  <FirebaseMediaManager
                    mediaItems={firebaseMedia}
                    showToast={showToast}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- شريط التواصل العلوي الرفيع والفاخر (Top Contact & Social Bar) ---- */}
      <div className="bg-slate-900 text-slate-300 border-b border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* أرقام الهواتف والواتساب */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-slate-400 font-medium">اتصل بنا:</span>
              <a href="tel:+201060524985" className="hover:text-white transition-colors font-mono">01060524985</a>
              <span className="text-slate-700">|</span>
              <a href="tel:+201141761261" className="hover:text-white transition-colors font-mono">01141761261</a>
            </div>
            <span className="hidden md:inline text-slate-700">•</span>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <a 
                href="https://wa.me/201141761261" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-emerald-400 transition-colors font-bold font-mono"
              >
                واتساب: 01141761261
              </a>
            </div>
          </div>

          {/* روابط شبكات التواصل الاجتماعي الفاخرة */}
          <div className="flex items-center gap-4">
            <span className="text-slate-500 hidden sm:inline">تابعنا على:</span>
            <div className="flex items-center gap-3">
              <a 
                href="https://web.facebook.com/almekawy.home?rdid=xIM9V6v8VmepuEBu&share_url=https%3A%2F%2Fweb.facebook.com%2Fshare%2F1Bfwi9XFow%2F%3F_rdc%3D1%26_rdr#" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-blue-500 transition-colors p-1 bg-slate-800 rounded-lg hover:bg-slate-700 flex items-center justify-center"
                title="فيسبوك المكاوي"
              >
                <Facebook className="w-3.5 h-3.5" />
              </a>
              <a 
                href="https://www.instagram.com/almekawy.home?igsh=bXBqZmw3NGt4bzVs" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-pink-500 transition-colors p-1 bg-slate-800 rounded-lg hover:bg-slate-700 flex items-center justify-center"
                title="إنستغرام المكاوي"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a 
                href="https://www.tiktok.com/@almekawy.home?_r=1&_t=ZS-971BmNPuWbk" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-rose-400 transition-colors px-2 py-0.5 bg-slate-800 rounded-lg hover:bg-slate-700 flex items-center gap-1 text-[10px] font-bold"
                title="تيك توك المكاوي"
              >
                <Video className="w-3 h-3 text-rose-500" />
                <span>TikTok</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ---- الهيدر الرئيسي الفاخر (Modern Navbar) ---- */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* الشعار المبتكر */}
          <div 
            onClick={() => setSelectedSectionView(null)}
            className="flex items-center gap-3 cursor-pointer hover:opacity-85 transition-opacity"
            title="العودة للصفحة الرئيسية"
          >
            <AlmekawyLogo size="md" variant="dark" showText={false} />
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>المكاوي هوم</span>
                <span className="text-sky-600 font-bold text-sm sm:text-base px-2 py-0.5 bg-sky-50 rounded-lg border border-sky-100 font-mono">UPVC</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium tracking-wide">AL-MEKAWY HOME UPVC PHOTO</p>
            </div>
          </div>

          {/* معلومات التواصل السريع والمشرف */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* رابط عمل عروض الأسعار الجديد والفاخر */}
            <a 
              href="https://al-mekawy-home.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 sm:gap-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold px-3 py-2.5 sm:px-4 sm:py-2.5 rounded-xl transition-all duration-300 shadow-md shadow-sky-600/15 cursor-pointer border border-sky-500 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Calculator className="w-4 h-4 text-sky-100" />
              <span>عمل عروض الأسعار</span>
            </a>

            {/* زر واتساب السريع المميز */}
            <a 
              href="https://wa.me/201141761261"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold px-3.5 py-2.5 rounded-xl transition-all duration-300 shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 animate-bounce" />
              <span>راسلنا الآن</span>
            </a>

            {!isAdmin ? (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-sky-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all duration-300 shadow-sm cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">دخول المشرف</span>
              </button>
            ) : (
              <button 
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 text-xs font-bold px-4 py-2.5 rounded-xl transition-all duration-300 border border-sky-150 cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>لوحة الصور</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {selectedSectionView === null ? (
        <>
          {/* ---- واجهة البانر الإعلاني الفاخر (Elegant Hero Section) ---- */}
          <section className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50 border-b border-slate-200/50 py-12 sm:py-16">
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-60"></div>
            <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
              <span className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-700 text-xs font-extrabold px-3 py-1.5 rounded-full border border-sky-100/80 mb-4 animate-pulse">
                ✨ كمال العزل وقمة الأناقة والأمان
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
                كتالوج أعمال <span className="text-sky-600">أبواب وشبابيك الـ PVC</span>
              </h2>
              <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed mb-6">
                مجموعة المكاوي الرائدة تقدم لكم قطاعات معززة بحديد التسليح المجلفن لمقاومة الأتربة، وعزل الصوت والحرارة بجدارة فائقة مع صور حقيقية من مشاريعنا المنفذة.
              </p>
              <div className="flex justify-center items-center gap-6 text-xs sm:text-sm font-semibold text-slate-500">
                <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-xs">
                  <Check className="text-sky-500 w-4 h-4" /> عزل كامل للغبار والأتربة
                </span>
                <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-xs">
                  <Check className="text-sky-500 w-4 h-4" /> ضمان معتمد 10 سنوات
                </span>
              </div>
            </div>
          </section>

          {/* ---- سلايدر المشاريع التفاعلي التلقائي الجديد (Auto-Playing Carousel Slider) ---- */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
            <div className="text-center mb-6">
              <span className="text-xs font-bold text-sky-600 tracking-wider uppercase font-mono px-3 py-1 bg-sky-50 rounded-full">🔄 معرض المشاريع الحي التفاعلي</span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-2.5">
                مشاريعنا المنفذة تتحرك أمام عينيك
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                تصفح لقطات حية حقيقية وتصميمات فريدة من أعمال شركة المكاوي، انقر للتكبير أو استكشاف القسم
              </p>
            </div>

            <div 
              id="home-carousel-container"
              className="relative w-full aspect-[16/10] sm:aspect-[21/9] max-h-[480px] bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/80 shadow-md group/carousel"
              onMouseEnter={() => setIsCarouselAutoplayPaused(true)}
              onMouseLeave={() => setIsCarouselAutoplayPaused(false)}
            >
              {/* Slideshow Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentCarouselIndex}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="absolute inset-0 w-full h-full"
                >
                  <img 
                    src={carouselItems[currentCarouselIndex].img} 
                    alt={carouselItems[currentCarouselIndex].title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover select-none"
                  />
                  {/* Subtle Dark Gradient Overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent"></div>
                </motion.div>
              </AnimatePresence>

              {/* Glassmorphic Slide Information Box */}
              <div className="absolute bottom-6 right-6 left-6 md:right-10 md:left-auto md:max-w-md p-5 rounded-2xl bg-slate-950/85 border border-slate-800 text-white backdrop-blur-md shadow-xl flex flex-col gap-2 text-right rtl z-10 transition-transform duration-300">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 bg-sky-500/20 text-sky-400 text-[10px] font-extrabold px-2 py-1 rounded-md border border-sky-500/30">
                    <ImageIcon className="w-3 h-3" />
                    {carouselItems[currentCarouselIndex].categoryLabel}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold font-sans">
                    لقطة {currentCarouselIndex + 1} من {carouselItems.length}
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-snug">
                  {carouselItems[currentCarouselIndex].title}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-2 md:line-clamp-none">
                  {carouselItems[currentCarouselIndex].description}
                </p>

                {/* Interactive Action Buttons */}
                <div className="flex items-center gap-2 mt-2">
                  {/* Zoom button */}
                  <button
                    onClick={() => openLightbox(
                      carouselItems.map(item => item.img), 
                      currentCarouselIndex, 
                      { type: 'custom', tab: carouselItems[currentCarouselIndex].category }
                    )}
                    className="flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer hover:scale-102"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>تكبير اللقطة</span>
                  </button>

                  {/* Explore section button */}
                  <button
                    onClick={() => {
                      setActiveGalleryTab(carouselItems[currentCarouselIndex].category);
                      setSelectedSectionView(carouselItems[currentCarouselIndex].category);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer hover:scale-102"
                  >
                    <span>استكشاف القسم</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Navigation Arrows */}
              <button 
                onClick={() => setCurrentCarouselIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length)}
                className="absolute top-1/2 left-4 transform -translate-y-1/2 p-2 rounded-full bg-slate-900/60 hover:bg-sky-600 text-white border border-slate-700/50 backdrop-blur-xs transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer opacity-0 group-hover/carousel:opacity-100 focus:opacity-100 z-10"
                title="الصورة السابقة"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <button 
                onClick={() => setCurrentCarouselIndex((prev) => (prev + 1) % carouselItems.length)}
                className="absolute top-1/2 right-4 transform -translate-y-1/2 p-2 rounded-full bg-slate-900/60 hover:bg-sky-600 text-white border border-slate-700/50 backdrop-blur-xs transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer opacity-0 group-hover/carousel:opacity-100 focus:opacity-100 z-10"
                title="الصورة التالية"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Dynamic Bottom Dots Indicator */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-1.5 z-10 bg-slate-950/40 px-3 py-1.5 rounded-full backdrop-blur-xs">
                {carouselItems.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentCarouselIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === currentCarouselIndex 
                        ? 'w-5 bg-sky-500' 
                        : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                    title={`الذهاب إلى الصورة ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* ---- قسم البنود الثلاثة الرئيسي للمكاوي UPVC ---- */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="text-center mb-10">
              <span className="text-xs font-bold text-sky-600 tracking-wider uppercase font-mono px-3 py-1 bg-sky-50 rounded-full">🔖 أقسام الكتالوج الرئيسية</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
                تصفح فئات أعمالنا الحية ومشاريعنا
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm mt-2">
                اضغط على أي بند من البنود التالية للانتقال الفوري إلى معرض الصور والمشاريع الخاصة به
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              
              {/* 1. الأبواب */}
              <div 
                onClick={() => {
                  setActiveGalleryTab('doors');
                  setSelectedSectionView('doors');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group relative bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute top-4 right-4 z-10 bg-slate-900/85 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-xs flex items-center gap-1.5">
                  <span>🚪 أبواب الـ PVC</span>
                </div>
                <div className="aspect-[16/10] sm:aspect-video overflow-hidden bg-slate-900">
                  <img 
                    src={DEFAULT_IMAGES.doorsCover} 
                    alt="الأبواب" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                </div>
                <div className="p-5 sm:p-6">
                  <h4 className="text-lg font-extrabold text-slate-900 group-hover:text-sky-600 transition-colors font-sans">أبواب الـ PVC الفخمة</h4>
                  <p className="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed font-sans">
                    أبواب داخلية وخارجية ممتازة وعازلة للحرارة والماء، مع قطاعات جرار ومفصلي تناسب الفلل والشقق والقصور.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-sky-600">
                    <span className="font-sans">تصفح معرض الصور والأعمال</span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-50 group-hover:bg-sky-100 transition-colors">
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. الشبابيك */}
              <div 
                onClick={() => {
                  setActiveGalleryTab('windows');
                  setSelectedSectionView('windows');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group relative bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute top-4 right-4 z-10 bg-slate-900/85 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-xs flex items-center gap-1.5">
                  <span>🪟 شبابيك الـ PVC</span>
                </div>
                <div className="aspect-[16/10] sm:aspect-video overflow-hidden bg-slate-900">
                  <img 
                    src={DEFAULT_IMAGES.windowsCover} 
                    alt="الشبابيك" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                </div>
                <div className="p-5 sm:p-6">
                  <h4 className="text-lg font-extrabold text-slate-900 group-hover:text-sky-600 transition-colors font-sans">شبابيك الـ PVC المانعة للغبار</h4>
                  <p className="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed font-sans">
                    شبابيك دبل جلاس عازلة للضوضاء والأتربة بالكامل بقطاعات ألمانية وتركية مع تسليح حديد مجلفن داخلي.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-sky-600">
                    <span className="font-sans">تصفح معرض الصور والأعمال</span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-50 group-hover:bg-sky-100 transition-colors">
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. البلكونات */}
              <div 
                onClick={() => {
                  setActiveGalleryTab('balconies');
                  setSelectedSectionView('balconies');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group relative bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute top-4 right-4 z-10 bg-slate-900/85 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-xs flex items-center gap-1.5 font-sans">
                  <span> balcon بلكونات الـ PVC</span>
                </div>
                <div className="aspect-[16/10] sm:aspect-video overflow-hidden bg-slate-900">
                  <img 
                    src={INITIAL_THREE_TAB_PHOTOS.balconies[0]} 
                    alt="البلكونات" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                </div>
                <div className="p-5 sm:p-6">
                  <h4 className="text-lg font-extrabold text-slate-900 group-hover:text-sky-600 transition-colors font-sans">تقفيل بلكونات الـ PVC</h4>
                  <p className="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed font-sans">
                    تصاميم حصرية لإحكام إغلاق وتقفيل الشرفات والبلكونات بمساحات واسعة لتوفير الهدوء التام والجمال المعماري العصري.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-sky-600">
                    <span className="font-sans">تصفح معرض الصور والأعمال</span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-50 group-hover:bg-sky-100 transition-colors">
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </section>

        </>
      ) : (
        /* Render separate sub-page for selectedSectionView */
        <motion.div
          key="selected-subpage"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
        >
          {/* Back button and navigation header */}
          <div className="mb-8 flex items-center justify-between gap-6 flex-wrap border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-sky-600 uppercase font-mono mb-2">
                <span>📁 معرض صور الأعمال الحية</span>
                <span>/</span>
                <span className="bg-sky-50 px-2 py-0.5 rounded text-[10px]">
                  {selectedSectionView === 'doors' ? 'الأبواب الـ PVC' : selectedSectionView === 'windows' ? 'الشبابيك الـ PVC' : 'تقفيل البلكونات'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {selectedSectionView === 'doors' 
                  ? 'معرض أبواب الـ PVC الفاخرة' 
                  : selectedSectionView === 'windows' 
                    ? 'معرض شبابيك الـ PVC المانعة للغبار والضوضاء' 
                    : 'معرض تقفيل بلكونات وشرفات الـ PVC'
                }
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed max-w-3xl">
                {selectedSectionView === 'doors'
                  ? 'تصاميم راقية للأبواب الداخلية والخارجية والجرارة والمفصلية المصنوعة من أجود قطاعات الـ PVC المقاومة للماء والحرارة وعوامل الرطوبة.'
                  : selectedSectionView === 'windows'
                    ? 'لقطات حية من مواقع تركيب الشبابيك دبل جلاس العازلة تماماً للأتربة والضوضاء بقطاعات ألمانية وتركية مسلحة من الداخل بالحديد المجلفن.'
                    : 'حلول عملية ومبتكرة لتقفيل الشرفات والبلكونات بمساحات زجاجية واسعة توفر الجمال المعماري والهدوء التام والوقاية من المطر والغبار.'
                }
              </p>
            </div>

            <button
              onClick={() => setSelectedSectionView(null)}
              className="flex items-center gap-2 bg-slate-900 hover:bg-sky-600 text-white font-extrabold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-102 active:scale-98 animate-fade-in"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة للرئيسية</span>
            </button>
          </div>

          {/* محتوى المعرض المنفصل للبند المحدد */}
          {(() => {
            const sectionFbImages = firebaseMedia.filter(m => m.category === selectedSectionView && m.type === 'image');
            const sectionFbVideos = firebaseMedia.filter(m => m.category === selectedSectionView && m.type === 'video');
            const currentSectionLocalPhotos = galleryPhotos[selectedSectionView] || [];
            const combinedImageUrls = [
              ...sectionFbImages.map(m => m.downloadURL),
              ...currentSectionLocalPhotos
            ];
            const totalSectionImages = combinedImageUrls.length;
            const totalSectionItems = totalSectionImages + sectionFbVideos.length;
            const totalFilteredCount = 
              galleryMediaFilter === 'all' 
                ? totalSectionItems 
                : galleryMediaFilter === 'image' 
                  ? totalSectionImages 
                  : sectionFbVideos.length;

            return (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-lg flex items-center gap-2 font-sans">
                      <span className="p-1.5 bg-sky-50 rounded-lg text-sky-600">★</span>
                      <span>اللقطات الحية والمشاريع المنفذة ({totalSectionItems})</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      انقر فوق أي صورة لتكبيرها أو الفيديو لتشغيله وتصفح أعمال شركة المكاوي بجودة فائقة
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
                    {/* فلاتر النوع: الكل / صور / فيديوهات */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setGalleryMediaFilter('all')}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          galleryMediaFilter === 'all' ? 'bg-white text-sky-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        الكل ({totalSectionItems})
                      </button>
                      <button
                        type="button"
                        onClick={() => setGalleryMediaFilter('image')}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                          galleryMediaFilter === 'image' ? 'bg-white text-sky-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <ImageIcon className="w-3 h-3" />
                        الصور ({totalSectionImages})
                      </button>
                      <button
                        type="button"
                        onClick={() => setGalleryMediaFilter('video')}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                          galleryMediaFilter === 'video' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Film className="w-3 h-3" />
                        الفيديوهات ({sectionFbVideos.length})
                      </button>
                    </div>

                    {/* زر إضافة وسائط جديدة للمشرف فقط */}
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => triggerCustomGalleryUpload(selectedSectionView)}
                        className="flex items-center gap-1.5 text-xs font-bold py-2 px-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white transition-all hover:scale-102 cursor-pointer shadow-xs font-sans"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إضافة صورة / فيديو للمشروع 📤</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowLoginModal(true)}
                        className="flex items-center gap-1.5 text-xs font-bold py-2 px-3 rounded-xl bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-600 border border-slate-200 transition-colors cursor-pointer"
                        title="تسجيل الدخول للمشرف لإضافة صور أو فيديوهات"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>دخول المشرف للإضافة</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* شبكة الوسائط للبند */}
                {totalFilteredCount > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {/* 1. عرض الفيديوهات المرفوعة في Firebase */}
                    {(galleryMediaFilter === 'all' || galleryMediaFilter === 'video') && sectionFbVideos.map((video) => (
                      <div
                        key={video.id}
                        className="group/video-item relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                      >
                        <video
                          src={video.downloadURL}
                          preload="metadata"
                          className="w-full h-full object-cover opacity-80 group-hover/video-item:opacity-90 group-hover/video-item:scale-105 transition-all duration-500"
                        />

                        {/* زر التشغيل في المركز */}
                        <button
                          type="button"
                          onClick={() => setPreviewVideo({ url: video.downloadURL, title: video.title, description: video.description })}
                          className="absolute inset-0 m-auto w-14 h-14 bg-rose-600/90 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-115 cursor-pointer z-10"
                          title="تشغيل الفيديو"
                        >
                          <Play className="w-6 h-6 fill-current ml-0.5" />
                        </button>

                        {/* شارة نوع الفيديو */}
                        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                          <span className="bg-slate-950/80 backdrop-blur-xs text-rose-300 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border border-rose-500/30">
                            <Film className="w-3.5 h-3.5 text-rose-400" />
                            <span>فيديو حقيقي 🎥</span>
                          </span>
                        </div>

                        {/* تذييل الفيديو مع العنوان والمشاركة */}
                        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent z-10 flex items-center justify-between gap-2">
                          <div className="text-right">
                            <h5 className="text-xs font-bold text-white line-clamp-1">
                              {video.title || video.name}
                            </h5>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {new Date(video.createdAt).toLocaleDateString('ar-EG')}
                            </p>
                          </div>

                          {/* أزرار المشاركة والحذف */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleShare(video.downloadURL, 'whatsapp')}
                              className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors cursor-pointer"
                              title="مشاركة عبر واتساب"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleShare(video.downloadURL, 'copy')}
                              className="p-1 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="نسخ الرابط"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleDeleteFirebaseMedia(video)}
                                className="p-1 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer ml-1"
                                title="حذف الفيديو نهائياً من Firebase"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* 2. عرض صور Firebase السحابية */}
                    {(galleryMediaFilter === 'all' || galleryMediaFilter === 'image') && sectionFbImages.map((imgItem, fbIdx) => {
                      const combinedIndex = fbIdx;
                      return (
                        <div
                          key={imgItem.id}
                          onClick={() => openLightbox(combinedImageUrls, combinedIndex)}
                          className="group/gallery-item relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 border border-slate-100 shadow-sm hover:shadow-lg cursor-zoom-in transition-all duration-300"
                        >
                          <img
                            src={imgItem.downloadURL}
                            alt={imgItem.title || `Firebase Project Shot ${fbIdx + 1}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover/gallery-item:scale-105 transition-all duration-500"
                          />

                          {/* شارة سحابة Firebase */}
                          <div className="absolute top-3 right-3 z-10">
                            <span className="bg-sky-950/80 backdrop-blur-xs text-sky-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-sky-400/30 flex items-center gap-1">
                              <span>☁️ موثقة سحابياً</span>
                            </span>
                          </div>

                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/gallery-item:opacity-100 transition-opacity flex flex-col items-center justify-between p-4">
                            <div className="w-full"></div>
                            <div className="bg-white/10 backdrop-blur-md p-3 rounded-full text-white hover:scale-110 transition-transform duration-200">
                              <Maximize2 className="w-5 h-5 drop-shadow-md" />
                            </div>
                            
                            {/* أزرار المشاركة السريعة */}
                            <div 
                              className="flex items-center gap-1.5 bg-slate-900/95 border border-slate-700/50 px-2.5 py-1.5 rounded-2xl shadow-lg" 
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="text-[10px] text-slate-300 font-bold font-sans">تحميل ومشاركة:</span>
                              <button 
                                onClick={(e) => handleShare(imgItem.downloadURL, 'download_share', e)}
                                className="p-1 hover:bg-sky-600/20 text-sky-400 rounded-full transition-colors cursor-pointer"
                                title="تحميل ومشاركة الصورة"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={(e) => handleShare(imgItem.downloadURL, 'whatsapp', e)}
                                className="p-1 hover:bg-emerald-600/20 text-emerald-400 rounded-full transition-colors cursor-pointer"
                                title="مشاركة عبر واتساب"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={(e) => handleShare(imgItem.downloadURL, 'copy', e)}
                                className="p-1 hover:bg-slate-700 text-slate-300 rounded-full transition-colors cursor-pointer"
                                title="نسخ الرابط"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* زر الحذف للمشرف فقط */}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFirebaseMedia(imgItem);
                              }}
                              className="absolute bottom-3 left-3 bg-red-600/90 hover:bg-red-700 text-white p-2.5 rounded-xl shadow-md hover:scale-110 transition-all duration-200 cursor-pointer z-10 border border-red-500"
                              title="حذف الصورة نهائياً من Firebase"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {/* 3. عرض الصور المحلية/الافتراضية للقسم */}
                    {(galleryMediaFilter === 'all' || galleryMediaFilter === 'image') && currentSectionLocalPhotos.map((img, index) => {
                      const combinedIndex = sectionFbImages.length + index;
                      return (
                        <div
                          key={`local-${index}`}
                          onClick={() => openLightbox(combinedImageUrls, combinedIndex, { type: 'custom', tab: selectedSectionView })}
                          className="group/gallery-item relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 border border-slate-100 shadow-sm hover:shadow-lg cursor-zoom-in transition-all duration-300"
                        >
                          <img
                            src={img}
                            alt={`Project shot ${index + 1}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover/gallery-item:scale-105 transition-all duration-500"
                          />
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/gallery-item:opacity-100 transition-opacity flex flex-col items-center justify-between p-4" id={`gallery-item-overlay-${index}`}>
                            <div className="w-full"></div>
                            <div className="bg-white/10 backdrop-blur-md p-3 rounded-full text-white hover:scale-110 transition-transform duration-200">
                              <Maximize2 className="w-5 h-5 drop-shadow-md" />
                            </div>
                            
                            {/* أزرار المشاركة السريعة */}
                            <div 
                              className="flex items-center gap-1.5 bg-slate-900/95 border border-slate-700/50 px-2.5 py-1.5 rounded-2xl shadow-lg" 
                              onClick={(e) => e.stopPropagation()}
                              id={`gallery-item-share-${index}`}
                            >
                              <span className="text-[10px] text-slate-300 font-bold font-sans">تحميل ومشاركة:</span>
                              <button 
                                onClick={(e) => handleShare(img, 'download_share', e)}
                                className="p-1 hover:bg-sky-600/20 text-sky-400 rounded-full transition-colors cursor-pointer animate-pulse"
                                title="تحميل ومشاركة الصورة كملف"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={(e) => handleShare(img, 'whatsapp', e)}
                                className="p-1 hover:bg-emerald-600/20 text-emerald-400 rounded-full transition-colors cursor-pointer"
                                title="تنزيل ومشاركة عبر واتساب"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={(e) => handleShare(img, 'facebook', e)}
                                className="p-1 hover:bg-blue-600/20 text-blue-400 rounded-full transition-colors cursor-pointer"
                                title="تنزيل ومشاركة عبر فيسبوك"
                              >
                                <Facebook className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={(e) => handleShare(img, 'copy', e)}
                                className="p-1 hover:bg-slate-700 text-slate-300 rounded-full transition-colors cursor-pointer"
                                title="نسخ رابط الصورة"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* زر حذف الصورة للمشرف فقط في حالة التعديل */}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCustomGalleryImage(selectedSectionView, index);
                              }}
                              className="absolute bottom-3 left-3 bg-red-600/90 hover:bg-red-700 text-white p-2.5 rounded-xl shadow-md hover:scale-110 transition-all duration-200 cursor-pointer z-10 border border-red-500 hover:bg-red-500 animate-fade-in"
                              title="حذف الصورة نهائياً من المعرض"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-2xl p-12 text-center border-2 border-dashed border-slate-200 max-w-lg mx-auto font-sans">
                    <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-base font-bold text-slate-700">لا توجد وسائط تطابق هذا الفلتر حالياً</p>
                    <p className="text-xs text-slate-500 mt-1 mb-6">
                      {isAdmin ? 'يمكنك رفع صور أو فيديوهات جديدة للمشروع من خلال الزر بالأعلى' : 'تابعنا للاطلاع على أحدث أعمال ومشاريع شركة المكاوي UPVC'}
                    </p>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => triggerCustomGalleryUpload(selectedSectionView)}
                        className="bg-white hover:bg-slate-100 text-sky-600 border border-slate-200 text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>رفع أول وسائط الآن</span>
                      </button>
                    )}
                  </div>
                )}

                {/* تلميح ذكي للمشرف */}
                {isAdmin && (
                  <div className="mt-6 bg-sky-50 text-sky-800 p-4 rounded-2xl border border-sky-100 text-xs sm:text-sm flex items-center gap-2">
                    <span>💡</span>
                    <span><strong>لوحة المشرف النشطة:</strong> يمكنك الضغط على أي صورة لعرضها بالحجم الكامل، أو الضغط على "إضافة صورة / فيديو للمشروع" لرفع ملفات حية ومباشرة لحفظها في سحابة Firebase والمزامنة الفورية مع كافة الأجهزة!</span>
                  </div>
                )}
              </div>
            );
          })()}
        </motion.div>
      )}

      {/* ---- الهيكل الهرمي التفاعلي للكتالوج (Doors vs Windows Selectors) ---- */}
      {false && (
      <main id="catalog-explore-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* شريط الإرجاع والتنقل في المستويات الفرعية */}
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              📂 تصفح الفئات الرئيسية
              {selectedCategoryId && (
                <span className="text-sky-600 text-sm sm:text-lg font-medium flex items-center gap-1.5">
                  <span className="text-slate-300">/</span>
                  {selectedCategoryId === 'doors' ? 'أبواب PVC' : 'شبابيك PVC'}
                </span>
              )}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {selectedCategoryId 
                ? 'اضغط على أي قطاع بالأسفل لمشاهدة الميزات الفنية ومعرض الأعمال ومشاريع المشرف'
                : 'اختر إحدى الفئتين الأساسيتين لبدء استكشاف التصاميم والقطاعات ومشاريعنا المعززة'
              }
            </p>
          </div>

          {/* زر الرجوع للرئيسية - شرطي الظهور */}
          {selectedCategoryId && (
            <button
              onClick={handleGoBackToMain}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl border border-slate-250 shadow-xs transition-all cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة للقائمة الرئيسية</span>
            </button>
          )}
        </div>

        {/* ---- القائمة الرئيسية ثنائية القسم (الأبواب والشبابيك) ---- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          
          {/* قسم الأبواب */}
          <div 
            onClick={() => handleSelectCategory('doors')}
            className={`group relative bg-white rounded-3xl overflow-hidden border transition-all duration-500 cursor-pointer shadow-sm hover:shadow-xl ${
              selectedCategoryId === null 
                ? 'scale-100 opacity-100 block' 
                : selectedCategoryId === 'doors' 
                  ? 'border-sky-500 ring-2 ring-sky-500/20 block md:col-span-2' 
                  : 'hidden'
            }`}
          >
            <div className="relative aspect-video sm:aspect-3/2 md:aspect-2/1 overflow-hidden bg-slate-900">
              <img 
                src={catalog.find(c => c.id === 'doors')?.image} 
                alt="Doors Section Cover" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent flex flex-col justify-end p-6 sm:p-8">
                <span className="text-xs font-bold text-sky-400 font-mono tracking-widest uppercase mb-1">SECTION DOORS</span>
                <h4 className="text-2xl sm:text-3xl font-extrabold text-white">قسم الأبواب الـ PVC الفخمة</h4>
                <p className="text-slate-300 text-xs sm:text-sm mt-1.5 max-w-xl leading-relaxed">
                  {catalog.find(c => c.id === 'doors')?.description}
                </p>
              </div>

              {/* زر تعديل غلاف القسم للمشرف */}
              {isAdmin && selectedCategoryId === null && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerImageUpload('category', 'doors');
                  }}
                  className="absolute top-4 right-4 bg-sky-600/90 hover:bg-sky-600 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center gap-1.5 shadow-md backdrop-blur-xs transition-transform hover:scale-105 cursor-pointer z-20"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>تعديل غلاف الأبواب</span>
                </button>
              )}
            </div>
            
            {/* مؤشر تفاعلي لطيف */}
            {selectedCategoryId === null && (
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm font-bold text-slate-600 group-hover:text-sky-600 transition-colors">
                <span>تصفح قطاعات الأبواب (جرار ومفصلي)...</span>
                <span className="flex items-center gap-1">
                  عرض الكتالوج <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </span>
              </div>
            )}
          </div>

          {/* قسم الشبابيك */}
          <div 
            onClick={() => handleSelectCategory('windows')}
            className={`group relative bg-white rounded-3xl overflow-hidden border transition-all duration-500 cursor-pointer shadow-sm hover:shadow-xl ${
              selectedCategoryId === null 
                ? 'scale-100 opacity-100 block' 
                : selectedCategoryId === 'windows' 
                  ? 'border-sky-500 ring-2 ring-sky-500/20 block md:col-span-2' 
                  : 'hidden'
            }`}
          >
            <div className="relative aspect-video sm:aspect-3/2 md:aspect-2/1 overflow-hidden bg-slate-900">
              <img 
                src={catalog.find(c => c.id === 'windows')?.image} 
                alt="Windows Section Cover" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent flex flex-col justify-end p-6 sm:p-8">
                <span className="text-xs font-bold text-sky-400 font-mono tracking-widest uppercase mb-1">SECTION WINDOWS</span>
                <h4 className="text-2xl sm:text-3xl font-extrabold text-white">قسم الشبابيك الـ PVC المقاومة للعزل</h4>
                <p className="text-slate-300 text-xs sm:text-sm mt-1.5 max-w-xl leading-relaxed">
                  {catalog.find(c => c.id === 'windows')?.description}
                </p>
              </div>

              {/* زر تعديل غلاف القسم للمشرف */}
              {isAdmin && selectedCategoryId === null && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerImageUpload('category', 'windows');
                  }}
                  className="absolute top-4 right-4 bg-sky-600/90 hover:bg-sky-600 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center gap-1.5 shadow-md backdrop-blur-xs transition-transform hover:scale-105 cursor-pointer z-20"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>تعديل غلاف الشبابيك</span>
                </button>
              )}
            </div>

            {/* مؤشر تفاعلي لطيف */}
            {selectedCategoryId === null && (
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm font-bold text-slate-600 group-hover:text-sky-600 transition-colors">
                <span>تصفح قطاعات الشبابيك (ألماني وتركي)...</span>
                <span className="flex items-center gap-1">
                  عرض الكتالوج <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ---- القوائم الفرعية لقطاعات الأبواب/الشبابيك (Subtypes Grid) ---- */}
        <AnimatePresence>
          {selectedCategoryId && currentCategory && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.4 }}
              className="mt-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="p-1.5 bg-sky-50 rounded-lg text-sky-600">★</span>
                  <span>القطاعات المتوفرة للـ {currentCategory.title}</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentCategory.subtypes.map((subtype) => {
                  const isSelected = selectedSubtype?.id === subtype.id;
                  return (
                    <div
                      key={subtype.id}
                      onClick={() => handleSelectSubtype(subtype)}
                      className={`group bg-white rounded-2xl overflow-hidden border shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer ${
                        isSelected 
                          ? 'border-sky-500 ring-4 ring-sky-500/15' 
                          : 'border-slate-200 hover:border-slate-350'
                      }`}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-5 h-full">
                        
                        {/* صورة القطاع التوضيحية */}
                        <div className="relative sm:col-span-2 h-48 sm:h-full bg-slate-900 overflow-hidden">
                          <img 
                            src={subtype.image} 
                            alt={subtype.name} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent sm:hidden"></div>
                          
                          {/* زر تعديل غلاف القطاع للمشرف */}
                          {isAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerImageUpload('subtype-cover', selectedCategoryId, subtype.id);
                              }}
                              className="absolute top-3 right-3 bg-sky-600/90 hover:bg-sky-600 text-white p-2 rounded-lg shadow-md hover:scale-105 transition-all cursor-pointer z-20"
                              title="تعديل غلاف هذا القطاع"
                            >
                              <Upload className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* معلومات ملخصة سريعة للقطاع */}
                        <div className="p-5 sm:col-span-3 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-extrabold text-sky-600 tracking-wide uppercase font-mono">UPVC SECTOR PROFILE</span>
                            <h5 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors mt-0.5">
                              {subtype.name}
                            </h5>
                            <p className="text-slate-500 text-xs mt-2 line-clamp-3 leading-relaxed">
                              {subtype.description}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                            <span className="text-slate-500">المنشأ: <span className="text-slate-900">{subtype.specs.origin}</span></span>
                            <span className="text-sky-600 flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform">
                              تفاصيل وصور المعرض
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---- تفاصيل القطاع المفتوح ومعرض الصور الخاص به (Detailed Sector View & Photos Upload) ---- */}
        <AnimatePresence>
          {selectedCategoryId && selectedSubtype && (
            <motion.div
              id="subtype-details-container"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
              className="mt-12 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-lg"
            >
              {/* ترويسة تفاصيل القطاع */}
              <div className="bg-slate-900 text-white p-6 sm:p-8 relative">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600"></div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                  <div>
                    <span className="text-xs font-bold text-sky-400 tracking-wider uppercase font-mono">Profile Specifications & Completed Projects</span>
                    <h4 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">{selectedSubtype.name}</h4>
                    <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-3xl leading-relaxed">
                      {selectedSubtype.description}
                    </p>
                  </div>

                  {/* المنشأ */}
                  <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-3 px-5 self-start md:self-auto flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-bold block">منشأ القطاع المعتمد</span>
                    <span className="text-base font-extrabold text-sky-400">{selectedSubtype.specs.origin}</span>
                  </div>
                </div>
              </div>

              {/* جسم التفاصيل (مقسم لعمودين: المواصفات والميزات / معرض صور الأعمال المنفذة) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8">
                
                {/* العمود الأيمن: الخصائص والمواصفات الفنية */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* الميزات الرئيسية كقائمة تشيك */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                    <h5 className="font-bold text-slate-900 text-sm sm:text-base border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                      <span className="text-sky-600">✔</span> ميزات القطاع الفنية والجمالية:
                    </h5>
                    <ul className="space-y-3">
                      {selectedSubtype.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                          <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* جدول المواصفات الهندسية الفاخر */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                    <h5 className="font-bold text-slate-900 text-sm sm:text-base border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                      <span className="text-sky-600">⚙</span> المواصفات الفنية والهندسية:
                    </h5>
                    <div className="divide-y divide-slate-200/60 text-xs sm:text-sm">
                      <div className="py-2.5 flex justify-between gap-4">
                        <span className="text-slate-500 font-medium">عدد غرف العزل (Chambers)</span>
                        <span className="text-slate-900 font-bold">{selectedSubtype.specs.chambers}</span>
                      </div>
                      <div className="py-2.5 flex justify-between gap-4">
                        <span className="text-slate-500 font-medium">معامل العزل الحراري (U-Value)</span>
                        <span className="text-slate-900 font-bold font-mono text-left">{selectedSubtype.specs.insulation}</span>
                      </div>
                      <div className="py-2.5 flex justify-between gap-4">
                        <span className="text-slate-500 font-medium">توافق سماكات الزجاج العازل</span>
                        <span className="text-slate-900 font-bold">{selectedSubtype.specs.glassCompatibility}</span>
                      </div>
                      <div className="py-2.5 flex justify-between gap-4">
                        <span className="text-slate-500 font-medium">العمر الافتراضي والضمان</span>
                        <span className="text-slate-900 font-bold">{selectedSubtype.specs.durability}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* العمود الأيسر: معرض الصور المرفوعة للأعمال والمشاريع (The core supervisor uploaded photo gallery) */}
                <div className="lg:col-span-7 space-y-6">
                  
                  <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3 flex-wrap">
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                        <span className="text-sky-600">🖼</span> معرض صور أعمالنا المنفذة بهذا القطاع:
                      </h5>
                      <p className="text-[11px] text-slate-500 mt-1">
                        صور واقعية حقيقية لفلل وشقق تم تركيب {selectedSubtype.name} بها
                      </p>
                    </div>

                    {/* زر رفع وإضافة صورة للمعرض - خاص بالمشرف */}
                    <button
                      onClick={() => triggerImageUpload('gallery-add', selectedCategoryId, selectedSubtype.id)}
                      className={`flex items-center gap-1.5 text-xs font-bold py-2 px-4 rounded-xl transition-all hover:scale-103 cursor-pointer shadow-xs ${
                        isAdmin 
                          ? 'bg-sky-600 hover:bg-sky-700 text-white' 
                          : 'bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-600 border border-slate-200'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة صور للقطاع {isAdmin ? '(رفع للمشرف)' : ''}</span>
                    </button>
                  </div>

                  {/* شبكة الصور التفاعلية للمعرض */}
                  {selectedSubtype.gallery && selectedSubtype.gallery.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {selectedSubtype.gallery.map((img, index) => (
                        <div 
                          key={index}
                          className="group/item relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-100 shadow-xs cursor-zoom-in"
                          onClick={() => openLightbox(selectedSubtype.gallery, index, { type: 'catalog', categoryId: selectedCategoryId || undefined, subtypeId: selectedSubtype.id })}
                        >
                          <img 
                            src={img} 
                            alt={`Project ${index + 1}`} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover/item:scale-108 transition-all duration-500"
                          />
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/item:opacity-100 transition-opacity flex flex-col items-center justify-between p-3" id={`catalog-item-overlay-${index}`}>
                            <div className="w-full"></div>
                            <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-full text-white hover:scale-110 transition-transform duration-200">
                              <Maximize2 className="text-white w-4 h-4 drop-shadow-md" />
                            </div>
                            
                            {/* أزرار المشاركة السريعة */}
                            <div 
                              className="flex items-center gap-1 bg-slate-900/95 border border-slate-700/50 px-1.5 py-1 rounded-xl shadow-md" 
                              onClick={(e) => e.stopPropagation()}
                              id={`catalog-item-share-${index}`}
                            >
                              <span className="text-[8px] text-slate-300 font-bold font-sans">تحميل ومشاركة:</span>
                              <button 
                                onClick={(e) => handleShare(img, 'download_share', e)}
                                className="p-0.5 hover:bg-sky-600/20 text-sky-400 rounded-full transition-colors cursor-pointer animate-pulse"
                                title="تحميل ومشاركة الصورة كملف"
                              >
                                <Share2 className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={(e) => handleShare(img, 'whatsapp', e)}
                                className="p-0.5 hover:bg-emerald-600/20 text-emerald-400 rounded-full transition-colors cursor-pointer"
                                title="تنزيل ومشاركة عبر واتساب"
                              >
                                <MessageCircle className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={(e) => handleShare(img, 'facebook', e)}
                                className="p-0.5 hover:bg-blue-600/20 text-blue-400 rounded-full transition-colors cursor-pointer"
                                title="تنزيل ومشاركة عبر فيسبوك"
                              >
                                <Facebook className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={(e) => handleShare(img, 'copy', e)}
                                className="p-0.5 hover:bg-slate-700 text-slate-300 rounded-full transition-colors cursor-pointer"
                                title="نسخ رابط الصورة"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* خيار الحذف السريع من المعرض */}
                          {isAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteGalleryImage(index, selectedCategoryId, selectedSubtype.id);
                              }}
                              className="absolute bottom-2 left-2 bg-red-600/95 hover:bg-red-700 text-white p-2 rounded-lg shadow-md hover:scale-110 transition-all duration-200 cursor-pointer z-10"
                              title="حذف هذه الصورة نهائياً"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-2xl p-8 text-center border-2 border-dashed border-slate-200">
                      <ImageIcon className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-600 mb-1">لا توجد صور مخصصة بعد في المعرض لهذا القطاع</p>
                      <p className="text-xs text-slate-400 mb-4">أنت تشاهد حالياً المواصفات القياسية. يرجى من المشرف رفع صور أعمال من لوحة التحكم.</p>
                      <button
                        onClick={() => triggerImageUpload('gallery-add', selectedCategoryId, selectedSubtype.id)}
                        className="bg-white hover:bg-slate-50 text-sky-600 border border-slate-200 text-xs font-bold py-2 px-4 rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ارفع أول صورة للمشروع الآن</span>
                      </button>
                    </div>
                  )}

                  {/* نصيحة للمشرف */}
                  {isAdmin && (
                    <div className="bg-sky-50 text-sky-700 p-3.5 rounded-xl border border-sky-100 text-xs leading-relaxed">
                      💡 <strong>نصيحة للمشرف:</strong> يمكنك النقر فوق أي صورة في المعرض لعرضها بحجم كامل، وتستطيع رفع صور المشاريع مباشرة من جوالك بلقطات واضحة ليراها الزوار فوراً.
                    </div>
                  )}

                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
      )}

      {selectedSectionView === null && (
        /* ---- ميزات ومزايا شركة المكاوي الفنية الكلية (Company Advantages Overview) ---- */
        <section className="bg-white border-t border-b border-slate-200/60 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="text-sky-600 font-bold text-xs sm:text-sm tracking-wider uppercase font-mono">WHY CHOOSE AL-MEKAWY PVC</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">لماذا تختار أبواب وشبابيك المكاوي UPVC؟</h3>
              <p className="text-slate-600 text-xs sm:text-sm mt-3 max-w-xl mx-auto leading-relaxed">
                نوظف أعلى جودة في تجميع قطاعات الـ PVC واللحامات حرارية المزدوجة لنضمن لبيتك أقصى درجات الراحة والعزل والاستقرار اللوني.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {advantages.map((adv, index) => {
                // أيقونة مخصصة لكل ميزة
                let IconComponent = Shield;
                if (adv.icon === 'Flame') IconComponent = Flame;
                if (adv.icon === 'Wind') IconComponent = Wind;
                if (adv.icon === 'Lock') IconComponent = Lock;

                return (
                  <div key={index} className="bg-slate-50/50 p-6 rounded-2xl border border-slate-150 hover:border-sky-200 hover:bg-white transition-all duration-300">
                    <div className="bg-sky-50 text-sky-600 p-3 rounded-xl w-fit mb-4">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-base mb-2">{adv.title}</h4>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{adv.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ---- الفوتر الأنيق والراقي لمعلومات الموقع والشركة ---- */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* معلومات الشعار والاسم */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <AlmekawyLogo size="sm" variant="dark" showText={false} />
              <h4 className="text-lg font-bold text-white tracking-wide">المكاوي هوم للـ UPVC</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4 max-w-sm">
              أبواب وشبابيك الـ PVC الفاخرة بقطاعات جرارة ومفصلية تركية وألمانية، جودة تصنيع متطورة وعزل مثالي للمياه والأتربة والضوضاء.
            </p>
            
            {/* أزرار التواصل الاجتماعي الفاخرة */}
            <div className="flex items-center gap-3 mb-5">
              <a 
                href="https://web.facebook.com/almekawy.home?rdid=xIM9V6v8VmepuEBu&share_url=https%3A%2F%2Fweb.facebook.com%2Fshare%2F1Bfwi9XFow%2F%3F_rdc%3D1%26_rdr#" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-slate-900 hover:bg-blue-600 text-slate-300 hover:text-white p-2.5 rounded-xl transition-all duration-300 border border-slate-800 flex items-center justify-center shadow-xs cursor-pointer"
                title="صفحة الفيسبوك"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href="https://www.instagram.com/almekawy.home?igsh=bXBqZmw3NGt4bzVs" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-slate-900 hover:bg-gradient-to-tr hover:from-yellow-500 hover:via-pink-500 hover:to-purple-600 text-slate-300 hover:text-white p-2.5 rounded-xl transition-all duration-300 border border-slate-800 flex items-center justify-center shadow-xs cursor-pointer"
                title="حساب الإنستغرام"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a 
                href="https://www.tiktok.com/@almekawy.home?_r=1&_t=ZS-971BmNPuWbk" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-slate-900 hover:bg-black text-slate-300 hover:text-white px-3 py-2 rounded-xl transition-all duration-300 border border-slate-800 flex items-center gap-1.5 shadow-xs cursor-pointer text-xs font-semibold"
                title="صفحة التيكتوك"
              >
                <Video className="w-3.5 h-3.5 text-rose-500" />
                <span>TikTok</span>
              </a>
            </div>

            <div className="text-xs font-mono tracking-wider text-slate-600">
              AL-MEKAWY HOME UPVC PHOTO © 2026
            </div>
          </div>

          {/* عناوين وتواصل تفاعلي */}
          <div className="space-y-3.5">
            <h5 className="text-white font-bold text-sm mb-2">تواصل معنا المباشر</h5>
            
            {/* أرقام الاتصال */}
            <div className="flex items-start gap-2.5 text-xs">
              <Phone className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1.5">
                <a href="tel:+201060524985" className="hover:text-sky-400 transition-colors font-medium">
                  مبيعات 1: <span className="font-mono">01060524985</span>
                </a>
                <a href="tel:+201141761261" className="hover:text-sky-400 transition-colors font-medium">
                  مبيعات 2: <span className="font-mono">01141761261</span>
                </a>
              </div>
            </div>

            {/* واتساب */}
            <div className="flex items-center gap-2.5 text-xs pt-1">
              <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <a 
                href="https://wa.me/201141761261" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors font-bold"
              >
                راسلنا على واتساب: <span className="font-mono">01141761261</span>
              </a>
            </div>
          </div>

          {/* تذييل المشرف السريع والدخول الآمن */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80">
            <h5 className="text-white font-bold text-sm mb-2">إدارة صور الكتالوج والمحتوى</h5>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              هذه البوابة مخصصة للمشرف المعتمد لإضافة الصور والأعمال وتحديث القطاعات الفنية بشكل دوري.
            </p>
            {!isAdmin ? (
              <button
                onClick={() => setShowLoginModal(true)}
                className="w-full bg-slate-800 hover:bg-sky-600 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>تسجيل دخول المشرف</span>
              </button>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-green-400 font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" /> وضع التعديل نشط حالياً
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/60 text-xs font-bold py-2 px-3 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>خروج المشرف والتمكين العادي</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </footer>

      {/* ---- مدخلات رفع الصور والملفات المخفية (Hidden File Inputs) ---- */}
      <input 
        type="file" 
        ref={categoryFileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={subtypeCoverFileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={galleryFileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        multiple
        className="hidden" 
      />
      <input 
        type="file" 
        ref={customGalleryInputRef} 
        onChange={handleCustomGalleryFileChange} 
        accept="image/*,video/*" 
        multiple
        className="hidden" 
      />

      {/* ---- نافذة الدخول للمشرف (Login Dialog / Modal) ---- */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden relative z-10 shadow-2xl border border-slate-100"
            >
              {/* شريط علوي ملون */}
              <div className="h-1.5 bg-sky-600"></div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Lock className="text-sky-600 w-5 h-5" />
                    بوابة دخول المشرف للكتالوج
                  </h4>
                  <button 
                    onClick={() => setShowLoginModal(false)}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                  الرجاء إدخال كلمة مرور المشرف للبدء في إدارة الصور ورفع أعمال شركة المكاوي في المعرض. <br />
                  <strong className="text-sky-600">كلمة المرور للتجربة: 662006</strong>
                </p>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">كلمة مرور المشرف (Password):</label>
                    <input 
                      type="password" 
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••"
                      autoFocus
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500 font-mono tracking-widest text-center"
                    />
                  </div>

                  {loginError && (
                    <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100 text-center font-semibold">
                      {loginError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowLoginModal(false)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 px-4 rounded-xl cursor-pointer transition-colors"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-3 px-4 rounded-xl cursor-pointer transition-colors"
                    >
                      تأكيد الدخول
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---- نافذة عرض الصور بكامل حجم الشاشة (Lightbox Slider) ---- */}
      <AnimatePresence>
        {lightboxIndex !== null && lightboxImages.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeLightbox}
              className="absolute inset-0 bg-black/95 backdrop-blur-xs"
            ></motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center z-10"
            >
              <img 
                src={lightboxImages[lightboxIndex]} 
                alt="Full project layout" 
                referrerPolicy="no-referrer"
                className="max-w-full max-h-full object-contain rounded-lg select-none"
              />

              {/* أزرار التنقل يمين ويسار إن كان هناك أكثر من صورة */}
              {lightboxImages.length > 1 && (
                <>
                  <button 
                    onClick={() => navigateLightbox('next')}
                    className="absolute right-2 sm:right-[-50px] bg-white/10 hover:bg-white/20 text-white p-3 rounded-full cursor-pointer transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => navigateLightbox('prev')}
                    className="absolute left-2 sm:left-[-50px] bg-white/10 hover:bg-white/20 text-white p-3 rounded-full cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* شريط المشاركة في المعاينة التكبيرية */}
              <div className="absolute top-[-44px] left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-700/50 flex items-center gap-2.5 shadow-lg z-20">
                <span className="text-slate-300 text-xs font-bold font-sans flex items-center gap-1 shrink-0">
                  <Share2 className="w-3.5 h-3.5 text-sky-400" />
                  <span className="hidden xs:inline">تحميل ومشاركة:</span>
                </span>
                <button 
                  onClick={() => handleShare(lightboxImages[lightboxIndex!], 'download_share')}
                  className="flex items-center gap-1 text-xs text-sky-400 hover:text-white bg-sky-500/10 hover:bg-sky-600 px-3 py-1 rounded-full transition-all duration-200 cursor-pointer font-bold shrink-0 animate-pulse"
                  title="تحميل ومشاركة الصورة كملف"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>تحميل ومشاركة كملف</span>
                </button>
                <button 
                  onClick={() => handleShare(lightboxImages[lightboxIndex!], 'whatsapp')}
                  className="flex items-center gap-1 text-xs text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-600 px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer font-bold shrink-0"
                  title="تنزيل ومشاركة عبر واتساب"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">واتساب</span>
                </button>
                <button 
                  onClick={() => handleShare(lightboxImages[lightboxIndex!], 'facebook')}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-600 px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer font-bold shrink-0"
                  title="تنزيل ومشاركة عبر فيسبوك"
                >
                  <Facebook className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">فيسبوك</span>
                </button>
                <button 
                  onClick={() => handleShare(lightboxImages[lightboxIndex!], 'copy')}
                  className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-600 px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer font-bold shrink-0"
                  title="نسخ الرابط"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">نسخ الرابط</span>
                </button>
              </div>

              {/* زر الإغلاق العلوي */}
              <button 
                onClick={closeLightbox}
                className="absolute top-[-40px] right-2 bg-white/15 hover:bg-white/30 text-white p-2 rounded-lg cursor-pointer transition-colors"
              >
                ✕ إغلاق المعاينة
              </button>

              {/* زر الحذف للمشرف */}
              {isAdmin && lightboxSource && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFromLightbox();
                  }}
                  className="absolute top-[-40px] left-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 text-xs font-bold shadow-md hover:scale-102 active:scale-98"
                  title="حذف هذه الصورة نهائياً من المعرض"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف الصورة 🗑️</span>
                </button>
              )}

              {/* مؤشر ترقيم الصور */}
              <div className="absolute bottom-[-35px] left-0 right-0 text-center text-slate-400 text-xs font-bold">
                صورة {lightboxIndex + 1} من أصل {lightboxImages.length}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---- مشغل الفيديو التفاعلي المنبثق (Video Player Modal) ---- */}
      <AnimatePresence>
        {previewVideo && (
          <div 
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setPreviewVideo(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col"
            >
              {/* شريط عنوان الفيديو والإغلاق */}
              <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
                    <Film className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="text-white font-bold text-sm sm:text-base">
                      {previewVideo.title || 'فيديو مشروع المكاوي UPVC'}
                    </h4>
                    {previewVideo.description && (
                      <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">
                        {previewVideo.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleShare(previewVideo.url, 'whatsapp')}
                    className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-xl transition-colors cursor-pointer"
                    title="مشاركة عبر واتساب"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleShare(previewVideo.url, 'copy')}
                    className="p-2 text-slate-300 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    title="نسخ الرابط"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewVideo(null)}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer text-xs font-bold"
                  >
                    ✕ إغلاق
                  </button>
                </div>
              </div>

              {/* مشغل الفيديو */}
              <div className="relative aspect-video bg-black flex items-center justify-center">
                <video
                  src={previewVideo.url}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---- إشعارات التنبيه المخصصة (Toast Message) ---- */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 left-6 right-6 sm:left-auto sm:max-w-md z-50 p-4 rounded-2xl shadow-xl border flex items-start gap-3 ${
              toast.type === 'success' 
                ? 'bg-green-50 text-green-800 border-green-200' 
                : toast.type === 'error' 
                  ? 'bg-red-50 text-red-800 border-red-200' 
                  : 'bg-sky-50 text-sky-800 border-sky-200'
            }`}
          >
            <div className="flex-1 text-xs sm:text-sm font-semibold leading-relaxed">
              {toast.message}
            </div>
            <button 
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer font-bold shrink-0"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
