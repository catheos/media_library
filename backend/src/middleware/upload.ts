import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import sharp from 'sharp';

export interface ProcessImageOptions {
  temp_path: string;
  id: number;
  folder: string; // e.g., 'media' or 'characters'
  generate_thumbnail?: boolean;
  thumbnail_size?: { width: number; height: number };
  quality?: number;
  thumbnail_quality?: number;
}

// Ensure upload directories exist
const uploadDir = path.join(process.cwd(), 'uploads');
const mediaDir = path.join(uploadDir, 'media');
const charactersDir = path.join(uploadDir, 'characters');
const tempDir = path.join(uploadDir, 'temp');

if (!fs.existsSync(mediaDir)) {
  fs.mkdirSync(mediaDir, { recursive: true });
}
if (!fs.existsSync(charactersDir)) {
  fs.mkdirSync(charactersDir, { recursive: true });
}
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Configure storage to temp directory first
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    crypto.randomBytes(16, (err, buf) => {
      if (err) {
        cb(err, '');
        return;
      }
      const filename = buf.toString('hex') + path.extname(file.originalname);
      cb(null, filename);
    });
  }
});

// File filter
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
  
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG and WebP are allowed.'), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  }
});

// Process and save image after upload
export const processImage = async (options: ProcessImageOptions): Promise<{ imagePath: string, thumbPath?: string }> => {
  const {
    temp_path,
    id,
    folder,
    generate_thumbnail = true,
    thumbnail_size = { width: 300, height: 300 },
    quality = 85,
    thumbnail_quality = 80
  } = options;

  try {
    // Validate it's a real image
    const metadata = await sharp(temp_path).metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image metadata');
    }

    const uploadFolder = path.join(uploadDir, folder);
    
    // Ensure folder exists
    if (!fs.existsSync(uploadFolder)) {
      fs.mkdirSync(uploadFolder, { recursive: true });
    }

    const imagePath = path.join(uploadFolder, `${id}.webp`);
    const thumbPath = generate_thumbnail ? path.join(uploadFolder, `${id}_thumb.webp`) : undefined;

    // Save full-size image as WebP (optimized)
    await sharp(temp_path)
      .webp({ quality })
      .toFile(imagePath);

    // Create thumbnail if requested
    if (generate_thumbnail && thumbPath) {
      await sharp(temp_path)
        .resize(thumbnail_size.width, thumbnail_size.height, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: thumbnail_quality })
        .toFile(thumbPath);
    }

    // Delete temp file
    fs.unlinkSync(temp_path);

    return {
      imagePath: `/uploads/${folder}/${id}.webp`,
      thumbPath: generate_thumbnail ? `/uploads/${folder}/${id}_thumb.webp` : undefined
    };
  } catch (error) {
    // Clean up temp file if processing fails
    if (fs.existsSync(temp_path)) {
      fs.unlinkSync(temp_path);
    }
    throw error;
  }
};
