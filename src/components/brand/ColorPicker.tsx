import { useState } from 'react';
import { Popover } from '@headlessui/react';
import { Check } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const predefinedColors = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#84CC16', // Lime
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
];

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(value);

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    onChange(newColor);
  };

  return (
    <Popover className="relative">
      <Popover.Button
        className="h-10 w-10 rounded-lg border border-gray-300 shadow-sm"
        style={{ backgroundColor: value }}
      >
        <span className="sr-only">Choose color</span>
      </Popover.Button>

      <Popover.Panel className="absolute z-10 mt-2 w-72 rounded-lg bg-white p-3 shadow-lg ring-1 ring-black ring-opacity-5">
        <div className="grid grid-cols-5 gap-2">
          {predefinedColors.map((color) => (
            <button
              key={color}
              className="relative h-8 w-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: color }}
              onClick={() => onChange(color)}
            >
              {color === value && (
                <Check
                  className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-white"
                  aria-hidden="true"
                />
              )}
              <span className="sr-only">Choose {color}</span>
            </button>
          ))}
        </div>

        <div className="mt-4">
          <label htmlFor="custom-color" className="block text-sm font-medium text-gray-700">
            Custom color
          </label>
          <div className="mt-1">
            <input
              type="color"
              id="custom-color"
              name="custom-color"
              value={customColor}
              onChange={handleCustomColorChange}
              className="h-8 w-full rounded-lg"
            />
          </div>
        </div>
      </Popover.Panel>
    </Popover>
  );
} 