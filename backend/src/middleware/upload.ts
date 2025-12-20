import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import sharp from 'sharp';

// Ensure upload directories exist
const uploadDir = path.join(process.cwd(), 'uploads', 'media');
const tempDir = path.join(process.cwd(), 'uploads', 'temp');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
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
export const processImage = async (tempPath: string, mediaId: number): Promise<{ imagePath: string, thumbPath: string }> => {
  try {
    // Validate it's a real image
    const metadata = await sharp(tempPath).metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image metadata');
    }

    const imagePath = path.join(uploadDir, `${mediaId}.webp`);
    const thumbPath = path.join(uploadDir, `${mediaId}_thumb.webp`);

    // Save full-size image as WebP (optimized)
    await sharp(tempPath)
      .webp({ quality: 85 })
      .toFile(imagePath);

    // Create thumbnail (300x300 cover)
    await sharp(tempPath)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 80 })
      .toFile(thumbPath);

    // Delete temp file
    fs.unlinkSync(tempPath);

    return {
      imagePath: `/uploads/media/${mediaId}.webp`,
      thumbPath: `/uploads/media/${mediaId}_thumb.webp`
    };
  } catch (error) {
    // Clean up temp file if processing fails
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    throw error;
  }
};