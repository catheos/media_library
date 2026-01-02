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

// Overall image settings
const MAX_SOURCE_DIMENSIONS = 8192; // Reject source images larger than this
const MIN_SOURCE_DIMENSIONS = { width: 300, height: 450 }; // Reject source images smaller than this
const FULL_SIZE = { width: 1000, height: 1500 }; // The size for downscale
const THUMB_SIZE = { width: 300, height: 450 }; // The size for thumbnail
const TARGET_RATIO = 2/3; // The ratio used to impose size on smaller images than max

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
    quality = 85,
    thumbnail_quality = 80
  } = options;

  try {
    // Validate it's a real image
    const metadata = await sharp(temp_path).metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image metadata');
    }

    // Reject absurdly large source images
    if (metadata.width > MAX_SOURCE_DIMENSIONS || metadata.height > MAX_SOURCE_DIMENSIONS) {
      throw new Error(`Image dimensions too large. Max ${MAX_SOURCE_DIMENSIONS}px per side`);
    }

    // Reject absurdly small source images
    if (metadata.width < MIN_SOURCE_DIMENSIONS.width || metadata.height < MIN_SOURCE_DIMENSIONS.height) {
      throw new Error(`Image dimensions too small. Min ${MIN_SOURCE_DIMENSIONS.width}/${MIN_SOURCE_DIMENSIONS.height}px (w x h)`);
    }

    const uploadFolder = path.join(uploadDir, folder);
    
    // Ensure folder exists
    if (!fs.existsSync(uploadFolder)) {
      fs.mkdirSync(uploadFolder, { recursive: true });
    }

    const imagePath = path.join(uploadFolder, `${id}.webp`);
    const thumbPath = generate_thumbnail ? path.join(uploadFolder, `${id}_thumb.webp`) : undefined;

    // Calculate target dimensions maintaining 2:3 ratio without upscaling
    // Find the largest 2:3 size that fits within both the source image AND our max size
    const maxWidth = Math.min(metadata.width, FULL_SIZE.width);
    const maxHeight = Math.min(metadata.height, FULL_SIZE.height);
    
    // Determine which dimension is the constraint for 2:3 ratio
    const constrainedByWidth = maxWidth / maxHeight < TARGET_RATIO;
    
    let targetWidth: number, targetHeight: number;
    if (constrainedByWidth) {
      targetWidth = maxWidth;
      targetHeight = Math.round(maxWidth / TARGET_RATIO);
    } else {
      targetHeight = maxHeight;
      targetWidth = Math.round(maxHeight * TARGET_RATIO);
    }

    // Save full-size image as WebP with enforced 2:3 ratio
    await sharp(temp_path)
      .resize(targetWidth, targetHeight, {
        fit: 'cover', // Crops to exact ratio
        position: 'center'
      })
      .webp({ quality })
      .toFile(imagePath);

    // Create thumbnail if requested
    if (generate_thumbnail && thumbPath) {
      await sharp(temp_path)
        .resize(THUMB_SIZE.width, THUMB_SIZE.height, {
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

// Delete images
export const deleteImages = async(options: { folder: string; filenames: string[]; }): Promise<{ deleted: string[]; notFound: string[] }> => {
  const { folder, filenames } = options;
  const deleted = [];
  const notFound = [];

  for (const filename of filenames) {
    const filePath = path.join(uploadDir, folder, filename);
    try {
      if(fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deleted.push(filename);
      };
    } catch {
      notFound.push(filename);
    }
  }

  return { deleted, notFound }
}