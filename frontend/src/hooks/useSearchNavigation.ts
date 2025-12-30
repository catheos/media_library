// hooks/useSearchNavigation.ts
import { useNavigate, useSearchParams } from "react-router-dom";
import { filtersToQueryParams } from "@/lib/utils";
import type { SearchFilters } from "@/lib/utils";

export const useSearchNavigation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSearch = (filters: SearchFilters) => {
    const filterParams = filtersToQueryParams(filters);
    const params = new URLSearchParams(filterParams);
    
    // Reset to page 1 when searching
    params.set('page', '1');
    
    navigate(`?${params.toString()}`, { replace: true });
  };

  return { handleSearch, searchParams };
};