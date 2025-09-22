'use client';

import { forwardRef } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Filter, MapPin } from 'lucide-react';
import { PILI_BARANGAYS } from './barangay-select';

interface BarangayFilterProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  includeSystemWide?: boolean;
  showIcon?: boolean;
  iconType?: 'filter' | 'mappin';
}

const BarangayFilter = forwardRef<HTMLButtonElement, BarangayFilterProps>(
  (
    {
      value = 'all',
      onValueChange,
      placeholder = "Filter by barangay",
      disabled = false,
      className = "w-44 h-14 border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-2xl bg-white",
      includeSystemWide = false,
      showIcon = true,
      iconType = 'filter',
      ...props
    },
    ref
  ) => {
    const handleValueChange = (selectedValue: string) => {
      if (onValueChange) {
        onValueChange(selectedValue);
      }
    };

    const IconComponent = iconType === 'filter' ? Filter : MapPin;

    return (
      <div className="relative">
        {showIcon && (
          <IconComponent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#666666] w-4 h-4 z-10" />
        )}
        <Select
          value={value}
          onValueChange={handleValueChange}
          disabled={disabled}
          {...props}
        >
          <SelectTrigger
            ref={ref}
            className={`${showIcon ? 'pl-10' : ''} ${className}`}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Barangays</SelectItem>
            {includeSystemWide && (
              <SelectItem value="system-wide">System-wide</SelectItem>
            )}
            {PILI_BARANGAYS.map((barangay) => (
              <SelectItem key={barangay} value={barangay}>
                {barangay}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }
);

BarangayFilter.displayName = 'BarangayFilter';

export default BarangayFilter;
