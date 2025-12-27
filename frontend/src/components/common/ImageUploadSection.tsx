import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/shadcn-io/dropzone';

interface ImageUploadSectionProps {
  image: File[] | undefined;
  onImageDrop: (files: File[]) => void;
  onImageError: (error: Error) => void;
  onClear: () => void;
  label?: string;
  required?: boolean;
  maxSize?: number;
  accept?: Record<string, string[]>;
}

const ImageUploadSection = ({
  image,
  onImageDrop,
  onImageError,
  onClear,
  label = 'Image',
  required = false,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp']
  }
}: ImageUploadSectionProps) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && ' *'}
      </Label>
      <Dropzone
        accept={accept}
        onDrop={onImageDrop}
        onError={onImageError}
        src={image}
        maxSize={maxSize}
      >
        <DropzoneEmptyState />
        <DropzoneContent />
      </Dropzone>
      
      {image && image[0] && (
        <div className="flex flex-col gap-2 mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(true)}
            className="w-full"
          >
            Preview Image
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onClear}
            className="w-full"
          >
            Clear Image
          </Button>
        </div>
      )}

      {/* Image Preview Modal */}
      {showPreview && image && image[0] && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPreview(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={URL.createObjectURL(image[0])}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadSection;