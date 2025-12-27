import type { LucideIcon } from "lucide-react";
import Loading from "@/components/common/Loading";

interface ImageContainerProps {
  imageUrl: string | null;
  imageFailed: boolean;
  alt: string;
  FallbackIcon: LucideIcon;
  aspectRatio?: "square" | "portrait" | "landscape" | "character";
  className?: string;
  iconSize?: "sm" | "md" | "lg";
}

const aspectRatioClasses = {
  square: "aspect-square",
  portrait: "aspect-[2/3]",
  landscape: "aspect-[16/9]",
  character: "aspect-[3/4]",
};

const iconSizeClasses = {
  sm: "w-[25%] h-[25%]",
  md: "w-[35%] h-[35%]",
  lg: "w-[45%] h-[45%]",
};

const ImageContainer = ({
  imageUrl,
  imageFailed,
  alt,
  FallbackIcon,
  aspectRatio = "portrait",
  className = "",
  iconSize = "lg",
}: ImageContainerProps) => {
  return (
    <div
      className={`${aspectRatioClasses[aspectRatio]} border ${imageUrl ? "border-transparent" : ""} rounded-lg overflow-hidden bg-muted flex items-center justify-center ${className}`}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={alt} className="w-full h-full object-cover" />
      ) : imageFailed ? (
        <FallbackIcon className={`${iconSizeClasses[iconSize]} text-muted-foreground`} />
      ) : (
        <Loading />
      )}
    </div>
  );
};

export default ImageContainer;