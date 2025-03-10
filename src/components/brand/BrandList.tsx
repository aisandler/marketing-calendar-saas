import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Brand } from '../../types/brand';
import { useBrand } from '../../contexts/BrandContext';

interface BrandListProps {
  onEdit: (brand: Brand) => void;
}

export function BrandList({ onEdit }: BrandListProps) {
  const { brands, deleteBrand } = useBrand();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteBrand(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (brands.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500">No brands added yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
      <ul className="divide-y divide-gray-200">
        {brands.map((brand) => (
          <li
            key={brand.id}
            className="flex items-center justify-between p-4 hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              <div
                className="h-6 w-6 rounded-full"
                style={{ backgroundColor: brand.color }}
              />
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  {brand.name}
                </h3>
                <p className="text-sm text-gray-500">{brand.code}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => onEdit(brand)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              >
                <Pencil className="h-5 w-5" />
                <span className="sr-only">Edit brand</span>
              </button>
              <button
                onClick={() => handleDelete(brand.id)}
                disabled={deletingId === brand.id}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingId === brand.id ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-red-600" />
                ) : (
                  <Trash2 className="h-5 w-5" />
                )}
                <span className="sr-only">Delete brand</span>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
} 