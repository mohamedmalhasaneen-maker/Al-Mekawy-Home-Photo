import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { v2 as cloudinary } from "cloudinary";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const GALLERY_FILE = path.join(process.cwd(), 'gallery_photos.json');
const CATALOG_FILE = path.join(process.cwd(), 'catalog_data.json');

// Helper to upload a base64 image to Cloudinary (falls back to base64 if not configured)
async function uploadToCloudinary(base64Str: string): Promise<string> {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn("Cloudinary is not configured. Saving image locally as base64.");
    return base64Str;
  }

  try {
    const result = await cloudinary.uploader.upload(base64Str, {
      folder: 'al_mekawy_home',
      resource_type: 'auto'
    });
    console.log("Successfully uploaded image to Cloudinary:", result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    return base64Str; // fallback
  }
}

// Helper to deep process catalog images and replace base64s with Cloudinary URLs
async function processCatalogImages(catalog: any[]): Promise<any[]> {
  const processedCatalog = [];
  for (const category of catalog) {
    const updatedCategory = { ...category };
    
    // 1. Process category cover image
    if (updatedCategory.image && updatedCategory.image.startsWith('data:image/')) {
      updatedCategory.image = await uploadToCloudinary(updatedCategory.image);
    }
    
    // 2. Process subtypes
    if (Array.isArray(updatedCategory.subtypes)) {
      const updatedSubtypes = [];
      for (const subtype of updatedCategory.subtypes) {
        const updatedSubtype = { ...subtype };
        
        // 2a. Process subtype cover image
        if (updatedSubtype.image && updatedSubtype.image.startsWith('data:image/')) {
          updatedSubtype.image = await uploadToCloudinary(updatedSubtype.image);
        }
        
        // 2b. Process subtype gallery images
        if (Array.isArray(updatedSubtype.gallery)) {
          const updatedGallery = [];
          for (const item of updatedSubtype.gallery) {
            if (item && item.startsWith('data:image/')) {
              const url = await uploadToCloudinary(item);
              updatedGallery.push(url);
            } else {
              updatedGallery.push(item);
            }
          }
          updatedSubtype.gallery = updatedGallery;
        }
        
        updatedSubtypes.push(updatedSubtype);
      }
      updatedCategory.subtypes = updatedSubtypes;
    }
    
    processedCatalog.push(updatedCategory);
  }
  return processedCatalog;
}

// Helper to read JSON safely
function readJsonFile(filePath: string, fallback: any) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
  }
  return fallback;
}

// Helper to write JSON safely
function writeJsonFile(filePath: string, data: any) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
}

// ---- KVDB.IO Cloud Sync Helper ----
const BUCKET = "mekawypvcef68fb64";

async function syncFromCloud() {
  console.log("🔄 Syncing data from Cloud Backup (kvdb.io)...");
  try {
    // Sync gallery photos
    const galleryRes = await fetch(`https://kvdb.io/${BUCKET}/gallery`);
    if (galleryRes.ok) {
      const text = await galleryRes.text();
      if (text && text.trim().startsWith('{')) {
        const galleryData = JSON.parse(text);
        fs.writeFileSync(GALLERY_FILE, JSON.stringify(galleryData), 'utf-8');
        console.log("✅ Synced gallery from cloud backup successfully.");
      }
    } else {
      console.log("ℹ️ No gallery backup found in cloud, using local or default.");
    }

    // Sync catalog
    const catalogRes = await fetch(`https://kvdb.io/${BUCKET}/catalog`);
    if (catalogRes.ok) {
      const text = await catalogRes.text();
      if (text && text.trim().startsWith('[')) {
        const catalogData = JSON.parse(text);
        fs.writeFileSync(CATALOG_FILE, JSON.stringify(catalogData), 'utf-8');
        console.log("✅ Synced catalog from cloud backup successfully.");
      }
    } else {
      console.log("ℹ️ No catalog backup found in cloud, using local or default.");
    }
  } catch (err) {
    console.error("❌ Failed to sync from cloud backup on startup:", err);
  }
}

async function triggerVercelDeploy() {
  const hookUrl = 'https://api.vercel.com/v1/integrations/deploy/prj_6Y1HYJ9dpddgSAMkej2wZ0AXeTh1/cFtkq4qZfF';
  
  try {
    const response = await fetch(hookUrl, {
      method: 'POST'
    });
    
    if (response.ok) {
      console.log('تم إرسال أمر التحديث بنجاح، الموقع هيتحدث كمان ثواني.');
    } else {
      console.log('فشل إرسال أمر التحديث.');
    }
  } catch (error) {
    console.error('حصل خطأ:', error);
  }
}

async function syncToCloud(key: 'gallery' | 'catalog', data: any) {
  try {
    console.log(`📤 Backing up ${key} to cloud (kvdb.io)...`);
    const res = await fetch(`https://kvdb.io/${BUCKET}/${key}`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) {
      console.log(`✅ Successfully backed up ${key} to cloud (kvdb.io).`);
    } else {
      console.error(`❌ Failed to backup ${key} to cloud: Status ${res.status}`);
    }
  } catch (err) {
    console.error(`❌ Error backup of ${key} to cloud:`, err);
  }
}

// API Routes
app.get("/api/gallery", (req, res) => {
  const data = readJsonFile(GALLERY_FILE, null);
  res.json({ success: true, data });
});

app.post("/api/gallery", async (req, res) => {
  const { photos } = req.body;
  if (!photos) {
    return res.status(400).json({ success: false, message: "Missing photos" });
  }

  const updatedPhotos = { ...photos };
  try {
    for (const tab of ['doors', 'windows', 'balconies'] as const) {
      if (Array.isArray(photos[tab])) {
        const list = [];
        for (const photo of photos[tab]) {
          if (photo && photo.startsWith('data:image/')) {
            const cloudUrl = await uploadToCloudinary(photo);
            list.push(cloudUrl);
          } else {
            list.push(photo);
          }
        }
        updatedPhotos[tab] = list;
      }
    }
    const success = writeJsonFile(GALLERY_FILE, updatedPhotos);
    if (success) {
      // Back up to cloud asynchronously so it doesn't block the API response
      syncToCloud('gallery', updatedPhotos).catch(err => console.error("Async gallery sync failed:", err));
      // Trigger Vercel Deploy Hook automatically
      triggerVercelDeploy().catch(err => console.error("Async Vercel deploy trigger failed:", err));
    }
    res.json({ success, data: updatedPhotos });
  } catch (error) {
    console.error("Error processing gallery photos upload:", error);
    res.status(500).json({ success: false, message: "Server error during processing" });
  }
});

app.get("/api/catalog", (req, res) => {
  const data = readJsonFile(CATALOG_FILE, null);
  res.json({ success: true, data });
});

app.post("/api/catalog", async (req, res) => {
  const { catalog } = req.body;
  if (!catalog) {
    return res.status(400).json({ success: false, message: "Missing catalog" });
  }

  try {
    const processedCatalog = await processCatalogImages(catalog);
    const success = writeJsonFile(CATALOG_FILE, processedCatalog);
    if (success) {
      // Back up to cloud asynchronously so it doesn't block the API response
      syncToCloud('catalog', processedCatalog).catch(err => console.error("Async catalog sync failed:", err));
      // Trigger Vercel Deploy Hook automatically
      triggerVercelDeploy().catch(err => console.error("Async Vercel deploy trigger failed:", err));
    }
    res.json({ success, data: processedCatalog });
  } catch (error) {
    console.error("Error processing catalog:", error);
    res.status(500).json({ success: false, message: "Server error during processing" });
  }
});


async function start() {
  // Sync the latest state from cloud backup before server handles any requests
  await syncFromCloud();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
