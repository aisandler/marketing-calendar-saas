import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Brand, CreateBrandInput } from '../../types/brand';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ColorPicker } from './ColorPicker';
import { BrandCodeValidator } from './BrandCodeValidator';
import { Loader2 } from 'lucide-react';

const brandSchema = z.object({
  name: z
    .string()
    .min(1, 'Brand name is required')
    .min(2, 'Brand name must be at least 2 characters')
    .max(50, 'Brand name must be at most 50 characters')
    .regex(/^[a-zA-Z0-9\s\-&]+$/, {
      message: 'Brand name can only contain letters, numbers, spaces, hyphens, and ampersands',
    })
    .transform(name => name.trim())
    .refine(name => name.length > 0, {
      message: 'Brand name cannot be only whitespace',
    }),
  code: z
    .string()
    .min(2, 'Brand code must be at least 2 characters')
    .max(10, 'Brand code must be at most 10 characters')
    .regex(/^[A-Z0-9_]+$/, {
      message: 'Brand code must contain only uppercase letters, numbers, and underscores',
    })
    .refine(code => !code.startsWith('_') && !code.endsWith('_'), {
      message: 'Brand code cannot start or end with an underscore',
    })
    .refine(code => !/_{2,}/.test(code), {
      message: 'Brand code cannot contain consecutive underscores',
    }),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, {
      message: 'Invalid color format. Must be a valid hex color (e.g., #FF0000)',
    })
    .transform(color => color.toUpperCase())
    .refine(color => {
      const [r, g, b] = [
        parseInt(color.slice(1, 3), 16),
        parseInt(color.slice(3, 5), 16),
        parseInt(color.slice(5, 7), 16),
      ];
      // Calculate relative luminance
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance >= 0.2 && luminance <= 0.8;
    }, {
      message: 'Please choose a color with better contrast (not too light or too dark)',
    }),
}).refine(data => {
  // Cross-field validation example
  return !(data.name.toUpperCase().replace(/[^A-Z0-9]/g, '') === data.code);
}, {
  message: 'Brand code should not be identical to the brand name',
  path: ['code'], // Show error on the code field
});

interface BrandFormProps {
  brand?: Brand;
  onSubmit: (data: CreateBrandInput) => Promise<void>;
  onCancel: () => void;
}

export function BrandForm({ brand, onSubmit, onCancel }: BrandFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<CreateBrandInput>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: brand?.name || '',
      code: brand?.code || '',
      color: brand?.color || '#FF0000',
    },
    mode: 'onChange', // Enable real-time validation
  });

  const handleFormSubmit = async (data: CreateBrandInput) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Watch form values for real-time validation
  const watchedName = watch('name');
  const watchedCode = watch('code');

  // Trigger validation when name changes (for cross-field validation)
  useEffect(() => {
    if (watchedName) {
      trigger('code');
    }
  }, [watchedName, trigger]);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Brand Name
        </label>
        <Input
          id="name"
          type="text"
          {...register('name')}
          error={errors.name?.message}
          disabled={isSubmitting}
          aria-describedby="name-description"
        />
        <p id="name-description" className="mt-1 text-sm text-gray-500">
          Use a clear, recognizable name. Letters, numbers, spaces, hyphens, and ampersands only.
        </p>
      </div>

      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700">
          Brand Code
        </label>
        <BrandCodeValidator
          id="code"
          {...register('code')}
          currentBrandId={brand?.id}
          error={errors.code?.message}
          disabled={isSubmitting}
          aria-describedby="code-description"
        />
        <p id="code-description" className="mt-1 text-sm text-gray-500">
          A unique identifier using uppercase letters, numbers, and underscores. Must be 2-10 characters.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Brand Color
        </label>
        <ColorPicker
          color={watch('color')}
          onChange={(color) => setValue('color', color)}
          disabled={isSubmitting}
          error={errors.color?.message}
        />
        <p className="mt-1 text-sm text-gray-500">
          Choose a color that represents your brand. Ensure it has good contrast for visibility.
        </p>
      </div>

      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {brand ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            brand ? 'Update Brand' : 'Create Brand'
          )}
        </Button>
      </div>
    </form>
  );
} 