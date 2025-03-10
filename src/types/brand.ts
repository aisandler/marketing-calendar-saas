export interface Brand {
  id: string;
  name: string;
  code: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBrandInput {
  name: string;
  code: string;
  color: string;
}

export interface UpdateBrandInput extends Partial<CreateBrandInput> {
  id: string;
}

export interface BrandValidationError {
  field: keyof CreateBrandInput;
  message: string;
}

export interface BrandContextType {
  brands: Brand[];
  loading: boolean;
  error: string | null;
  createBrand: (brand: CreateBrandInput) => Promise<void>;
  updateBrand: (brand: UpdateBrandInput) => Promise<void>;
  deleteBrand: (id: string) => Promise<void>;
  validateBrandCode: (code: string) => Promise<boolean>;
} 