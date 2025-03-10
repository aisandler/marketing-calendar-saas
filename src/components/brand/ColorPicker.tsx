import { useState, useEffect, useRef } from 'react';
import { HexColorPicker } from 'react-colorful';
import { cn } from '../../lib/utils';

export interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  error?: string;
}

export function ColorPicker({ color, onChange, disabled, error }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popover = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popover.current && !popover.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          'h-10 w-10 rounded-md border shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          error && 'border-red-300 ring-red-500',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        style={{ backgroundColor: color }}
        disabled={disabled}
        aria-label="Choose color"
        aria-invalid={!!error}
        aria-describedby={error ? 'color-error' : undefined}
      />

      {error && (
        <p id="color-error" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}

      {isOpen && (
        <div
          ref={popover}
          className="absolute left-0 top-12 z-10 rounded-md border border-gray-200 bg-white p-3 shadow-lg"
        >
          <HexColorPicker color={color} onChange={onChange} />
          <input
            type="text"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              'mt-3 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-500'
            )}
            pattern="^#[0-9A-Fa-f]{6}$"
            title="Please enter a valid hex color code (e.g., #FF0000)"
            aria-invalid={!!error}
          />
        </div>
      )}
    </div>
  );
} 