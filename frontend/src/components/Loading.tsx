import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  className?: string;
  text?: string;
  delay?: number; // delay in ms before showing spinner
}

const Loading = ({ 
  size = "md", 
  fullScreen = false,
  className,
  text,
  delay = 200
}: LoadingProps) => {
  const [show, setShow] = useState(delay === 0);

  useEffect(() => {
    if (delay === 0) return;

    const timer = setTimeout(() => {
      setShow(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!show) return null;

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  const containerClasses = fullScreen 
    ? "fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50"
    : "flex items-center justify-center py-8";

  return (
    <div className={cn(containerClasses, className)}>
      <div className="flex flex-col items-center gap-2">
        <Loader2 className={cn(sizeClasses[size], "animate-spin text-primary")} />
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
    </div>
  );
};

export default Loading;