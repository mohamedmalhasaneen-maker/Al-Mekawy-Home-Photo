import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Trash2, 
  Film, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ExternalLink, 
  FolderPlus, 
  Info, 
  Play
} from 'lucide-react';
import { MediaItem, MediaCategory } from '../types';
import { 
  uploadMediaToFirebase, 
  deleteMediaFromFirebase, 
  isFirebaseConfigured 
} from '../lib/firebase';

interface FirebaseMediaManagerProps {
  mediaItems: MediaItem[];
  onMediaChanged?: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const FirebaseMediaManager: React.FC<FirebaseMediaManagerProps> = ({
  mediaItems,
  showToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<MediaCategory>('doors');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ name: string; url: string; isVideo: boolean; size: number }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isConfigured = isFirebaseConfigured();

  const handleFilesSelection = (files: FileList | File[]) => {
    const validFiles: File[] = [];
    const previews: { name: string; url: string; isVideo: boolean; size: number }[] = [];

    Array.from(files).forEach((file) => {
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');

      if (!isImg && !isVid) {
        showToast(`⚠️ تم تجاهل الملف "${file.name}" لأنه ليس صورة أو فيديو.`, 'error');
        return;
      }

      const maxSizeBytes = isVid ? 150 * 1024 * 1024 : 30 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        showToast(
          `⚠️ حجم الملف كبير (${(file.size / (1024 * 1024)).toFixed(1)}MB). الأقصى هو ${isVid ? '150MB للفيديو' : '30MB للصورة'}.`,
          'error'
        );
        return;
      }

      validFiles.push(file);
      const isVideo = isVid;
      const url = URL.createObjectURL(file);
      previews.push({ name: file.name, url, isVideo, size: file.size });
    });

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      setFilePreviews(previews);
      if (!title && validFiles.length === 1) {
        const nameWithoutExt = validFiles[0].name.substring(0, validFiles[0].name.lastIndexOf('.')) || validFiles[0].name;
        setTitle(nameWithoutExt);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelection(e.dataTransfer.files);
    }
  };

  const handleSubmitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      showToast('يرجى تحديد ملف صورة أو فيديو أولاً.', 'info');
      return;
    }

    if (!isConfigured) {
      showToast('⚠️ إعدادات Firebase غير مكتملة في متغيرات البيئة. يرجى مراجعة إرشادات الربط أدناه.', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      let completed = 0;
      const total = selectedFiles.length;

      // رفع كافة الملفات بالتوازي لتسريع العملية وسلاستها القصوى
      const uploadPromises = selectedFiles.map(async (file, idx) => {
        const itemTitle = selectedFiles.length === 1 && title.trim()
          ? title.trim()
          : file.name.substring(0, file.name.lastIndexOf('.')) || `مشروع ${idx + 1}`;

        const res = await uploadMediaToFirebase(
          file,
          {
            title: itemTitle,
            description: description.trim(),
            category: selectedCategory,
          }
        );
        completed++;
        setUploadProgress(Math.round((completed / total) * 100));
        return res;
      });

      const settledResults = await Promise.allSettled(uploadPromises);
      const successes = settledResults.filter(r => r.status === 'fulfilled').length;
      const failures = settledResults.filter(r => r.status === 'rejected').length;

      if (successes > 0) {
        showToast(`✅ تم حفظ ${successes} ${successes > 1 ? 'ملفات' : 'ملف'} في سحابة Firebase بنجاح وسرعة فائقة!`, 'success');
      }
      if (failures > 0) {
        showToast(`⚠️ تعذر رفع ${failures} ملف، يرجى المحاولة مرة أخرى.`, 'error');
      }
      
      // تفريغ المدخلات بعد النجاح
      setSelectedFiles([]);
      setFilePreviews([]);
      setTitle('');
      setDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error(err);
      showToast(`❌ فشل الرفع: ${err.message || 'حدث خطأ غير متوقع'}`, 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (!confirm(`هل أنت متأكد من حذف ${item.type === 'video' ? 'الفيديو' : 'الصورة'} "${item.title || item.name}" نهائياً من السحابة؟`)) {
      return;
    }

    setDeletingId(item.id);
    try {
      await deleteMediaFromFirebase(item);
      showToast('🗑️ تم حذف الملف نهائياً من Firebase Storage و Firestore بنجاح.', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(`❌ تعذر الحذف: ${err.message}`, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredItems = mediaItems.filter(item => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    return true;
  });

  return (
    <div className="space-y-8" id="firebase-media-manager">
      
      {/* تنبيه حالة الربط بـ Firebase */}
      {!isConfigured ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-2 text-xs sm:text-sm">
              <h5 className="font-bold text-amber-950 text-sm">
                📌 تنبيه إعدادات Firebase Storage & Firestore
              </h5>
              <p className="leading-relaxed">
                لم يتم رصد مفاتيح Firebase في متغيرات البيئة (<code>VITE_FIREBASE_...</code>) حتى الآن.
                لتفعيل الرفع السحابي الدائم وحفظ الصور والفيديوهات عبر جميع الأجهزة، يرجى إضافة الإعدادات في ملف <code>.env</code>:
              </p>
              <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] overflow-x-auto text-left dir-ltr space-y-1">
                <div>VITE_FIREBASE_API_KEY=AIzaSy...</div>
                <div>VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com</div>
                <div>VITE_FIREBASE_PROJECT_ID=your-project-id</div>
                <div>VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app</div>
                <div>VITE_FIREBASE_MESSAGING_SENDER_ID=...</div>
                <div>VITE_FIREBASE_APP_ID=1:...:web:...</div>
              </div>
              <p className="text-[11px] text-amber-800">
                💡 ملاحظة: الموقع يعمل حالياً بالكتالوج والوسائط التلقائية، وبمجرد إضافة هذه المتغيرات سيبدأ الرفع والتخزين السحابي الفوري فوراً.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-900 flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>نظام التخزين السحابي الدائم (Firebase Storage & Firestore) متصل وجاهز للعمل.</span>
          </div>
          <span className="bg-emerald-600 text-white text-[10px] font-mono px-2.5 py-1 rounded-full shrink-0">
            Active Cloud
          </span>
        </div>
      )}

      {/* قسم الرفع السحابي الجديد */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-base">
                رفع صورة أو فيديو جديد إلى Firebase
              </h4>
              <p className="text-xs text-slate-500">
                يتم التخزين في Firebase Storage وتوثيق البيانات في Firestore لتظهر لجميع الزوار على أي جهاز فوراً
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmitUpload} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* اختيار القسم */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                القسم المستهدف:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as MediaCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white"
              >
                <option value="doors">🚪 أبواب الـ PVC (Doors)</option>
                <option value="windows">🪟 شبابيك الـ PVC (Windows)</option>
                <option value="balconies">🏡 تقفيل البلكونات (Balconies)</option>
              </select>
            </div>

            {/* عنوان الملف */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                عنوان اللقطة أو الفيديو:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: تركيب شباك دبل زجاج جورجيا فيلا التجمع"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          {/* وصف الملف */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              وصف مختصر للمشروع أو اللقطة (اختياري):
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثال: قطاع تركي عازل للصوت والأتربة مع إكسسوارات إغلاق أوروبية"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          {/* منطقة السحب والإفلات وتحديد الملف */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              الملف (صورة أو فيديو):
            </label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                selectedFiles.length > 0 
                  ? 'border-sky-400 bg-sky-50/50' 
                  : 'border-slate-300 hover:border-sky-400 hover:bg-slate-50'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFilesSelection(e.target.files);
                  }
                }}
                accept="image/*,video/*"
                multiple
                className="hidden"
              />

              {selectedFiles.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-2 border-b border-slate-200">
                    <span>الملفات المحددة للرفع السحابي ({selectedFiles.length}):</span>
                    <span className="text-sky-600 font-semibold underline text-[11px]">
                      اضغط لإعادة الاختيار أو إضافة ملفات
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-48 overflow-y-auto p-1">
                    {filePreviews.map((preview, i) => (
                      <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-900 flex items-center justify-center">
                        {preview.isVideo ? (
                          <div className="flex flex-col items-center justify-center text-rose-400 p-2 text-center">
                            <Film className="w-6 h-6 mb-1" />
                            <span className="text-[9px] text-white font-mono truncate max-w-[70px]">{preview.name}</span>
                          </div>
                        ) : (
                          <img
                            src={preview.url}
                            alt={preview.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <span className="absolute bottom-1 right-1 bg-slate-950/80 text-[8px] text-white px-1 rounded font-mono">
                          {(preview.size / (1024 * 1024)).toFixed(1)}M
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center">
                    <FolderPlus className="w-6 h-6" />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-800">
                    اضغط لتحديد عدة صور أو فيديوهات دفعة واحدة، أو اسحب الملفات وأفلتها هنا
                  </div>
                  <p className="text-[11px] text-slate-400">
                    يمكنك تحديد أكثر من صورة في نفس الوقت • الصور حتى 30MB والفيديوهات حتى 150MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* شريط التقدم أثناء الرفع Progress Bar */}
          {isUploading && (
            <div className="space-y-2 bg-sky-50 p-4 rounded-xl border border-sky-100">
              <div className="flex items-center justify-between text-xs font-bold text-sky-800">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                  جاري رفع وحفظ {selectedFiles.length} ملف بالتوازي في Firebase...
                </span>
                <span className="font-mono">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-sky-200/60 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-sky-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* زر تأكيد الرفع */}
          <button
            type="submit"
            disabled={selectedFiles.length === 0 || isUploading}
            className={`w-full py-3 px-6 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              selectedFiles.length === 0 || isUploading
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-sky-600 hover:bg-sky-700 text-white shadow-md hover:shadow-lg active:scale-98'
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري الحفظ في السحابة ({uploadProgress}%)...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>
                  {selectedFiles.length > 1
                    ? `بدء الرفع السحابي لـ ${selectedFiles.length} ملفات دفعة واحدة`
                    : 'بدء الرفع السحابي إلى Firebase الآن'}
                </span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* قائمة الملفات المرفوعة في Firebase وإدارتها */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
          <div>
            <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <span>ملفات الوسائط السحابية المحفوظة في Firebase</span>
              <span className="bg-sky-50 text-sky-600 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
                {mediaItems.length}
              </span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              هذه الملفات محفوظة في السحابة الدائمة وتظهر لجميع الأجهزة والزوار مباشرة
            </p>
          </div>

          {/* فلاتر العرض */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50"
            >
              <option value="all">كل الأقسام</option>
              <option value="doors">الأبواب الـ PVC</option>
              <option value="windows">الشبابيك الـ PVC</option>
              <option value="balconies">تقفيل البلكونات</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50"
            >
              <option value="all">الكل (صور وفيديوهات)</option>
              <option value="image">صور فقط 📷</option>
              <option value="video">فيديوهات فقط 🎥</option>
            </select>
          </div>
        </div>

        {/* عرض العناصر */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <Info className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs sm:text-sm">لا توجد وسائط مرفوعة في Firebase حتى الآن تطابق هذا الفلتر.</p>
            <p className="text-[11px] text-slate-400">استخدم النموذج بالأعلى لرفع أول صورة أو فيديو وسينعكس فوراً على الموقع.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group relative bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:border-sky-300 transition-all hover:shadow-md"
              >
                {/* المعاينة */}
                <div className="relative aspect-video bg-slate-900 overflow-hidden">
                  {item.type === 'video' ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <video
                        src={item.downloadURL}
                        preload="metadata"
                        className="w-full h-full object-cover opacity-80"
                      />
                      <button
                        type="button"
                        onClick={() => setPreviewVideoUrl(item.downloadURL)}
                        className="absolute inset-0 m-auto w-12 h-12 bg-sky-600/90 hover:bg-sky-600 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer"
                        title="تشغيل الفيديو"
                      >
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </button>
                    </div>
                  ) : (
                    <img
                      src={item.downloadURL}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}

                  {/* شارات النوع والقسم */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    <span className="bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      {item.type === 'video' ? <Film className="w-3 h-3 text-rose-400" /> : <ImageIcon className="w-3 h-3 text-sky-400" />}
                      {item.type === 'video' ? 'فيديو' : 'صورة'}
                    </span>
                    <span className="bg-sky-950/80 backdrop-blur-xs text-sky-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {item.category === 'doors' ? 'أبواب' : item.category === 'windows' ? 'شبابيك' : 'بلكونات'}
                    </span>
                  </div>
                </div>

                {/* تفاصيل الملف */}
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h5 className="font-extrabold text-slate-900 text-xs sm:text-sm line-clamp-1">
                      {item.title || item.name}
                    </h5>
                    {item.description && (
                      <p className="text-slate-500 text-[11px] line-clamp-2 mt-0.5">
                        {item.description}
                      </p>
                    )}
                    <div className="text-[10px] text-slate-400 font-mono mt-1.5">
                      {new Date(item.createdAt).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })} • {(item.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>

                  {/* أزرار الإجراءات (فتح الرابط والحذف) */}
                  <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                    <a
                      href={item.downloadURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>رابط السحابة</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                      className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* مودال تشغيل الفيديو للمعاينة */}
      {previewVideoUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xs"
          onClick={() => setPreviewVideoUrl(null)}
        >
          <div 
            className="relative w-full max-w-3xl bg-slate-950 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white text-xs font-bold">
              <span>معاينة تشغيل الفيديو من Firebase Storage</span>
              <button
                type="button"
                onClick={() => setPreviewVideoUrl(null)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded"
              >
                ✕ إغلاق
              </button>
            </div>
            <video
              src={previewVideoUrl}
              controls
              autoPlay
              className="w-full max-h-[75vh] object-contain"
            />
          </div>
        </div>
      )}

    </div>
  );
};
