import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

type SortableHeaderProps = {
  label: string;
  sortKey: string;
  currentSort: any;
  requestSort: (key: any) => void;
  className?: string;
};

export default function SortableHeader({ label, sortKey, currentSort, requestSort, className = '' }: SortableHeaderProps) {
  const isActive = currentSort?.key === sortKey;
  return (
    <th 
      className={`px-6 py-4 font-semibold sticky top-0 z-10 bg-slate-50 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors ${className}`} 
      onClick={() => requestSort(sortKey)}
    >
      <div className={`flex items-center gap-1 ${className.includes('text-right') ? 'justify-end' : className.includes('text-center') ? 'justify-center' : 'justify-start'}`}>
        {label}
        {isActive ? (
          currentSort.direction === 'asc' ? <ArrowUp size={14} className="text-fuchsia-600" /> : <ArrowDown size={14} className="text-fuchsia-600" />
        ) : (
          <ArrowUpDown size={14} className="text-slate-300" />
        )}
      </div>
    </th>
  );
}
