import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Brand, CreateBrandInput, UpdateBrandInput } from '../../types/brand';
import { useBrand } from '../../contexts/BrandContext';
import { BrandList } from './BrandList';
import { BrandForm } from './BrandForm';

export function BrandManagement() {
  const { createBrand, updateBrand } = useBrand();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | undefined>();

  const handleCreate = async (data: CreateBrandInput) => {
    try {
      await createBrand(data);
      setIsFormOpen(false);
    } catch (error) {
      console.error('Failed to create brand:', error);
    }
  };

  const handleUpdate = async (data: CreateBrandInput) => {
    if (!editingBrand) return;

    try {
      await updateBrand({
        id: editingBrand.id,
        ...data,
      });
      setEditingBrand(undefined);
    } catch (error) {
      console.error('Failed to update brand:', error);
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingBrand(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Brand Management</h2>
        {!isFormOpen && (
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Brand
          </button>
        )}
      </div>

      {isFormOpen ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h3 className="mb-4 text-base font-medium text-gray-900">
            {editingBrand ? 'Edit Brand' : 'Add New Brand'}
          </h3>
          <BrandForm
            brand={editingBrand}
            onSubmit={editingBrand ? handleUpdate : handleCreate}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <BrandList onEdit={handleEdit} />
      )}
    </div>
  );
} 