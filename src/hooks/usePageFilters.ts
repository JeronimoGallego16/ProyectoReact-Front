import { useState, useEffect } from 'react';

export function usePageFilters<T extends { id: string }>(
  tableData: T[],
  filterFn: (data: T[], filters: Record<string, any>) => T[]
) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [filteredData, setFilteredData] = useState<T[]>([]);

  useEffect(() => {
    setFilteredData(filterFn(tableData, filters));
  }, [tableData, filters, filterFn]);

  return {
    filters,
    setFilters,
    filteredData,
    handleFilterChange: (newFilters: Record<string, string>) => setFilters(newFilters),
  };
}