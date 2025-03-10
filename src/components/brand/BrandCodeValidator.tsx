import { useEffect, useState } from 'react';
import { useBrand } from '../../contexts/BrandContext';
import { Check, X } from 'lucide-react';

interface BrandCodeValidatorProps {
  code: string;
  onValidation: (isValid: boolean) => void;
}

export function BrandCodeValidator({ code, onValidation }: BrandCodeValidatorProps) {
  const { validateBrandCode } = useBrand();
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const checkCode = async () => {
      if (!code) {
        setIsValid(null);
        onValidation(false);
        return;
      }

      setIsChecking(true);
      try {
        const valid = await validateBrandCode(code);
        setIsValid(valid);
        onValidation(valid);
      } catch (error) {
        setIsValid(false);
        onValidation(false);
      } finally {
        setIsChecking(false);
      }
    };

    const timeoutId = setTimeout(checkCode, 500);
    return () => clearTimeout(timeoutId);
  }, [code, validateBrandCode, onValidation]);

  if (!code) return null;

  return (
    <div className="mt-1 flex items-center space-x-2">
      {isChecking ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      ) : isValid === true ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : isValid === false ? (
        <X className="h-4 w-4 text-red-500" />
      ) : null}
      
      <span className={`text-sm ${
        isValid === true
          ? 'text-green-600'
          : isValid === false
          ? 'text-red-600'
          : 'text-gray-500'
      }`}>
        {isChecking
          ? 'Checking code...'
          : isValid === true
          ? 'Code is available'
          : isValid === false
          ? 'Code is already taken'
          : ''}
      </span>
    </div>
  );
} 