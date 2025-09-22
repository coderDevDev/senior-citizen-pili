'use client';

import { forwardRef } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';

// List of all barangays in Pili, Camarines Sur
export const PILI_BARANGAYS = [
  "Anayan",
  "Bagong Sirang",
  "Binanwaanan",
  "Binobong",
  "Cadlan",
  "Caroyroyan",
  "Curry",
  "Del Rosario",
  "Himaao",
  "La Purisima",
  "New San Roque",
  "Old San Roque (Poblacion)",
  "Palestina",
  "Pawili",
  "Sagrada",
  "Sagurong",
  "San Agustin",
  "San Antonio (Poblacion)",
  "San Isidro (Poblacion)",
  "San Jose",
  "San Juan (Poblacion)",
  "San Vicente (Poblacion)",
  "Santiago (Poblacion)",
  "Santo Niño",
  "Tagbong",
  "Tinangis"
];

interface BarangaySelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  includeSystemWide?: boolean;
  includeAllOption?: boolean;
  showIcon?: boolean;
  error?: string;
  id?: string;
}

const BarangaySelect = forwardRef<HTMLButtonElement, BarangaySelectProps>(
  (
    {
      value,
      onValueChange,
      placeholder = "Select barangay",
      label,
      required = false,
      disabled = false,
      className = "",
      includeSystemWide = false,
      includeAllOption = false,
      showIcon = true,
      error,
      id,
      ...props
    },
    ref
  ) => {
    const handleValueChange = (selectedValue: string) => {
      if (onValueChange) {
        onValueChange(selectedValue);
      }
    };

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <div className="relative">
          {showIcon && (
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
          )}
          <Select
            value={value}
            onValueChange={handleValueChange}
            disabled={disabled}
            {...props}
          >
            <SelectTrigger
              ref={ref}
              id={id}
              className={`${showIcon ? 'pl-10' : ''} ${className} ${
                error ? 'border-red-500 focus:border-red-500' : ''
              }`}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {includeAllOption && (
                <SelectItem value="all">All Barangays</SelectItem>
              )}
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
        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
      </div>
    );
  }
);

BarangaySelect.displayName = 'BarangaySelect';

export default BarangaySelect;
