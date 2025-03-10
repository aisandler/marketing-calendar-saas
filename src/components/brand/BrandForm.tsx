import { useState } from 'react';
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
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(10, 'Code must be at most 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Code must contain only uppercase letters and numbers'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
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
  } = useForm<CreateBrandInput>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: brand?.name || '',
      code: brand?.code || '',
      color: brand?.color || '#FF0000',
    },
  });

  const handleFormSubmit = async (data: CreateBrandInput) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Brand Name
        </label>
        <Input
          id="name"
          type="text"
          {...register('name', { required: 'Brand name is required' })}
          error={errors.name?.message}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700">
          Brand Code
        </label>
        <BrandCodeValidator
          id="code"
          {...register('code', {
            required: 'Brand code is required',
            pattern: {
              value: /^[A-Z0-9_]+$/,
              message: 'Brand code must be uppercase letters, numbers, and underscores only',
            },
          })}
          currentBrandId={brand?.id}
          error={errors.code?.message}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Brand Color
        </label>
        <ColorPicker
          color={watch('color')}
          onChange={(color) => setValue('color', color)}
          disabled={isSubmitting}
        />
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