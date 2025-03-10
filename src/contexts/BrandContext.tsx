import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Brand, BrandContextType, CreateBrandInput, UpdateBrandInput } from '../types/brand';

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBrands();
  }, []);

  async function fetchBrands() {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name');

      if (error) throw error;
      setBrands(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching brands');
    } finally {
      setLoading(false);
    }
  }

  async function createBrand(brand: CreateBrandInput) {
    try {
      const { error } = await supabase
        .from('brands')
        .insert([brand]);

      if (error) throw error;
      await fetchBrands();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while creating the brand');
      throw err;
    }
  }

  async function updateBrand({ id, ...updates }: UpdateBrandInput) {
    try {
      const { error } = await supabase
        .from('brands')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchBrands();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while updating the brand');
      throw err;
    }
  }

  async function deleteBrand(id: string) {
    try {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchBrands();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while deleting the brand');
      throw err;
    }
  }

  async function validateBrandCode(code: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('code')
        .eq('code', code);

      if (error) throw error;
      return data.length === 0;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while validating the brand code');
      throw err;
    }
  }

  const value: BrandContextType = {
    brands,
    loading,
    error,
    createBrand,
    updateBrand,
    deleteBrand,
    validateBrandCode,
  };

  return (
    <BrandContext.Provider value={value}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
} 