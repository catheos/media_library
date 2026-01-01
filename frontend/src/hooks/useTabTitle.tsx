import { useEffect } from "react";

export const useTabTitle = (title: string) => {
  useEffect(() => {
    document.title = title ? `${title} | Media Library` : "Media Library";
  }, [title]);
}