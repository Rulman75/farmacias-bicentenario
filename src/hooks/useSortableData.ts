import { useState, useMemo } from 'react';

export function useSortableData<T>(items: T[], config: { key: keyof T, direction: 'asc' | 'desc' } | null = null) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof T, direction: 'asc' | 'desc' } | null>(config);

  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        // Support nested keys like "sucursalData.1.cantidad"
        const getNestedValue = (obj: any, path: string) => {
          return path.split('.').reduce((acc, part) => acc && acc[part], obj);
        };
        
        const keyStr = String(sortConfig.key);
        const aVal = keyStr.includes('.') ? getNestedValue(a, keyStr) : a[sortConfig.key as keyof T];
        const bVal = keyStr.includes('.') ? getNestedValue(b, keyStr) : b[sortConfig.key as keyof T];
        
        // Handle undefined/null values
        if (aVal === undefined || aVal === null) return sortConfig.direction === 'asc' ? 1 : -1;
        if (bVal === undefined || bVal === null) return sortConfig.direction === 'asc' ? -1 : 1;

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key: keyof T) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
}
