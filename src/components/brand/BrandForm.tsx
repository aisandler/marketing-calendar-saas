import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Brand, CreateBrandInput } from '../../types/brand';
import { ColorPicker } from './ColorPicker';
import { BrandCodeValidator } from './BrandCodeValidator';

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
  const [isCodeValid, setIsCodeValid] = useState(true);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CreateBrandInput>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: brand?.name || '',
      code: brand?.code || '',
      color: brand?.color || '#3B82F6',
    },
  });

  const currentColor = watch('color');

  useEffect(() => {
    register('color');
  }, [register]);

  const onFormSubmit = handleSubmit(async (data) => {
    if (!isCodeValid) return;
    await onSubmit(data);
  });

  return (
    <form onSubmit={onFormSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Brand Name
        </label>
        <input
          type="text"
          id="name"
          {...register('name')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700">
          Brand Code
        </label>
        <input
          type="text"
          id="code"
          {...register('code')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
        {errors.code && (
          <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
        )}
        <BrandCodeValidator
          code={watch('code')}
          onValidation={setIsCodeValid}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Brand Color
        </label>
        <div className="mt-1">
          <ColorPicker
            value={currentColor}
            onChange={(color) => setValue('color', color)}
          />
        </div>
        {errors.color && (
          <p className="mt-1 text-sm text-red-600">{errors.color.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !isCodeValid}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : brand ? 'Update Brand' : 'Create Brand'}
        </button>
      </div>
    </form>
  );
} 