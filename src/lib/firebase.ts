import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  Firestore 
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes,
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject, 
  FirebaseStorage 
} from 'firebase/storage';
import { 
  getAuth, 
  signInAnonymously, 
  Auth 
} from 'firebase/auth';
import { MediaItem, MediaCategory } from '../types';
import { fastCompressImageFile } from '../utils/imageOptimizer';

export interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

// قراءة بيانات التكوين من متغيرات البيئة VITE_
export const getEnvFirebaseConfig = (): FirebaseConfig => {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  };
};

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;
let authInstance: Auth | null = null;

// فحص جاهزية وتوافر إعدادات Firebase
export const isFirebaseConfigured = (): boolean => {
  const cfg = getEnvFirebaseConfig();
  return Boolean(cfg.apiKey && cfg.projectId && cfg.storageBucket);
};

export const initFirebase = () => {
  if (appInstance) {
    return { app: appInstance, db: dbInstance!, storage: storageInstance!, auth: authInstance! };
  }

  const config = getEnvFirebaseConfig();

  if (!config.apiKey || !config.projectId) {
    console.warn("⚠️ إعدادات Firebase غير مكتملة في متغيرات البيئة (VITE_FIREBASE_...). يرجى إضافتها للتخزين السحابي الدائم.");
    return null;
  }

  try {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(config);
    dbInstance = getFirestore(appInstance);
    storageInstance = getStorage(appInstance);
    authInstance = getAuth(appInstance);

    // محاولة تسجيل دخول مجهول اختياري لتمكين أذونات الأدمن الآمنة (request.auth != null)
    try {
      signInAnonymously(authInstance).catch(err => {
        console.warn("Firebase anonymous auth notice:", err.message);
      });
    } catch (authErr) {
      console.warn("Firebase Auth init:", authErr);
    }

    return { app: appInstance, db: dbInstance, storage: storageInstance, auth: authInstance };
  } catch (error) {
    console.error("❌ فشل تهيئة Firebase:", error);
    return null;
  }
};

/**
 * دالة رفع الصور والفيديوهات إلى Firebase Storage وحفظ السجل في Firestore
 */
export const uploadMediaToFirebase = async (
  file: File,
  details: {
    title: string;
    description: string;
    category: MediaCategory;
  },
  onProgress?: (percent: number) => void
): Promise<MediaItem> => {
  const fb = initFirebase();
  if (!fb || !fb.storage || !fb.db) {
    throw new Error('يرجى ضبط بيانات ربط Firebase أولاً لتفعيل التخزين السحابي الدائم.');
  }

  // التحقق من نوع الملف
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  if (!isImage && !isVideo) {
    throw new Error('نوع الملف غير مدعوم. يرجى اختيار ملف صورة أو فيديو فقط.');
  }

  // التحقق من حجم الملف (صور حتى 30MB، فيديوهات حتى 150MB)
  const maxSizeBytes = isVideo ? 150 * 1024 * 1024 : 30 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(
      `حجم الملف كبير جداً (${(file.size / (1024 * 1024)).toFixed(1)}MB). الحد الأقصى للـ ${isVideo ? 'فيديو هو 150MB' : 'صورة هو 30MB'}.`
    );
  }

  // تحسين وضغط الصورة بسرعة فائقة قبل الرفع السحابي لتوفير الوقت وسرعة الإرسال بنسبة تفوق 80%
  let uploadPayload: Blob | File = file;
  if (isImage) {
    try {
      uploadPayload = await fastCompressImageFile(file, 1600, 1200, 0.85);
    } catch {
      uploadPayload = file;
    }
  }

  // إنشاء مسار فريد للملف داخل Firebase Storage
  const extension = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const timestamp = Date.now();
  const folder = isVideo ? 'videos' : 'images';
  const storagePath = `media/${details.category}/${folder}/${timestamp}_${cleanName}.${extension}`;

  const storageRef = ref(fb.storage, storagePath);

  // 1. رفع الملف مع متابعة نسبة التقدم (Progress Bar)
  let downloadURL = '';
  if (onProgress) {
    const uploadTask = uploadBytesResumable(storageRef, uploadPayload, {
      contentType: file.type || 'image/jpeg',
      customMetadata: {
        category: details.category,
        title: details.title,
      }
    });

    downloadURL = await new Promise<string>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error("Firebase Storage Upload Error:", error);
          reject(new Error(`فشل رفع الملف إلى Firebase Storage: ${error.message}`));
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          } catch (err: any) {
            reject(new Error(`فشل استخراج رابط التحميل: ${err?.message || err}`));
          }
        }
      );
    });
  } else {
    // رفع مباشر فائق السرعة عبر uploadBytes عند عدم الحاجة لـ onProgress
    const uploadRes = await uploadBytes(storageRef, uploadPayload, {
      contentType: file.type || 'image/jpeg',
      customMetadata: {
        category: details.category,
        title: details.title,
      }
    });
    downloadURL = await getDownloadURL(uploadRes.ref);
  }

  // 2. حفظ بيانات الملف في Firestore collection "media" فقط بعد نجاح الرفع
  try {
    const mediaData = {
      type: isVideo ? ('video' as const) : ('image' as const),
      title: details.title.trim() || file.name,
      description: details.description.trim() || '',
      category: details.category,
      storagePath,
      downloadURL,
      createdAt: timestamp,
      size: file.size,
      name: file.name,
      fileType: file.type,
    };

    const docRef = await addDoc(collection(fb.db, 'media'), mediaData);

    return {
      id: docRef.id,
      ...mediaData,
    };
  } catch (firestoreError: any) {
    console.error("Firebase Firestore Save Error:", firestoreError);
    // تنظيف الملف من التخزين في حال فشل تسجيل الداتا لضمان عدم وجود ملفات معلقة
    try {
      await deleteObject(storageRef);
    } catch (cleanupErr) {
      console.warn("Cleanup storage failed:", cleanupErr);
    }
    throw new Error(`فشل حفظ بيانات الملف في Firestore: ${firestoreError?.message || firestoreError}`);
  }
};

/**
 * حذف الملف من Firebase Storage وقاعدة بيانات Firestore
 */
export const deleteMediaFromFirebase = async (item: MediaItem): Promise<void> => {
  const fb = initFirebase();
  if (!fb || !fb.storage || !fb.db) {
    throw new Error('Firebase غير مهيأ للحذف.');
  }

  // 1. حذف الملف من Storage إذا كان المسار موجوداً
  if (item.storagePath) {
    try {
      const fileRef = ref(fb.storage, item.storagePath);
      await deleteObject(fileRef);
    } catch (storageErr: any) {
      // إذا كان الملف غير موجود أصلاً في Storage نتجاهل الخطأ ونكمل لحذف السجل
      console.warn("Storage delete notice (may already be deleted):", storageErr.message);
    }
  }

  // 2. حذف السجل من Firestore
  try {
    await deleteDoc(doc(fb.db, 'media', item.id));
  } catch (dbErr: any) {
    throw new Error(`فشل حذف السجل من Firestore: ${dbErr?.message || dbErr}`);
  }
};

/**
 * الاستماع الحي والمباشر لجميع الوسائط المخزنة في Firebase
 */
export const subscribeToMediaCollection = (
  onData: (items: MediaItem[]) => void,
  onError?: (err: Error) => void
) => {
  const fb = initFirebase();
  if (!fb || !fb.db) {
    if (onError) onError(new Error("Firebase is not initialized."));
    return () => {};
  }

  try {
    const q = query(collection(fb.db, 'media'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: MediaItem[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          items.push({
            id: docSnap.id,
            type: d.type || 'image',
            title: d.title || '',
            description: d.description || '',
            category: d.category || 'doors',
            storagePath: d.storagePath || '',
            downloadURL: d.downloadURL || '',
            createdAt: d.createdAt || Date.now(),
            size: d.size || 0,
            name: d.name || '',
            fileType: d.fileType || '',
          });
        });
        onData(items);
      },
      (error) => {
        console.error("Firestore snapshot error:", error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err: any) {
    console.error("Failed to subscribe to media collection:", err);
    if (onError) onError(err);
    return () => {};
  }
};
