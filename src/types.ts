export interface ProductSubtype {
  id: string;
  name: string;
  englishName: string;
  description: string;
  image: string;
  gallery: string[]; // صور إضافية من المعرض لرفعها من قبل المشرف
  features: string[];
  specs: {
    chambers: string;      // عدد الغرف/الحجرات في القطاع
    insulation: string;    // معامل العزل
    glassCompatibility: string; // سمك وتوافق الزجاج
    durability: string;    // العمر الافتراضي والتحمل
    origin: string;        // منشأ القطاع
  };
}

export interface CatalogCategory {
  id: 'doors' | 'windows';
  title: string;
  englishTitle: string;
  description: string;
  image: string;
  subtypes: ProductSubtype[];
}

export interface Advantage {
  icon: string;
  title: string;
  description: string;
}

export type MediaCategory = 'doors' | 'windows' | 'balconies';

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  title: string;
  description: string;
  category: MediaCategory;
  storagePath: string;
  downloadURL: string;
  createdAt: number;
  size: number;
  name: string;
  fileType: string;
}

