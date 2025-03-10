import React, { forwardRef, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Input } from '../ui/Input';

export interface BrandCodeValidatorProps extends React.InputHTMLAttributes<HTMLInputElement> {
  currentBrandId?: string;
  error?: string;
}

export const BrandCodeValidator = forwardRef<HTMLInputElement, BrandCodeValidatorProps>(
  ({ currentBrandId, error, onChange, ...props }, ref) => {
    const [isChecking, setIsChecking] = useState(false);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [value, setValue] = useState(props.defaultValue as string || '');

    useEffect(() => {
      let timeoutId: NodeJS.Timeout;

      const checkAvailability = async () => {
        if (!value) {
          setIsAvailable(null);
          return;
        }

        setIsChecking(true);
        try {
          const query = supabase
            .from('brands')
            .select('id')
            .eq('code', value.toUpperCase());

          if (currentBrandId) {
            query.neq('id', currentBrandId);
          }

          const { data } = await query;
          setIsAvailable(!data || data.length === 0);
        } catch (error) {
          console.error('Error checking brand code availability:', error);
          setIsAvailable(null);
        } finally {
          setIsChecking(false);
        }
      };

      if (value) {
        timeoutId = setTimeout(checkAvailability, 500);
      } else {
        setIsAvailable(null);
      }

      return () => {
        clearTimeout(timeoutId);
      };
    }, [value, currentBrandId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value.toUpperCase();
      setValue(newValue);
      e.target.value = newValue;
      onChange?.(e);
    };

    const getHelperText = () => {
      if (error) return error;
      if (isChecking) return 'Checking availability...';
      if (isAvailable === true) return 'Brand code is available';
      if (isAvailable === false) return 'Brand code is already taken';
      return '';
    };

    const getHelperColor = () => {
      if (error) return 'text-red-600';
      if (isChecking) return 'text-gray-500';
      if (isAvailable === true) return 'text-green-600';
      if (isAvailable === false) return 'text-red-600';
      return '';
    };

    return (
      <div>
        <Input
          {...props}
          ref={ref}
          value={value}
          onChange={handleChange}
          error={getHelperText()}
          className={isAvailable === true ? 'border-green-300 focus:border-green-500 focus:ring-green-500' : undefined}
        />
        {!error && (isChecking || isAvailable !== null) && (
          <p className={`mt-1 text-sm ${getHelperColor()}`}>
            {getHelperText()}
          </p>
        )}
      </div>
    );
  }
);

BrandCodeValidator.displayName = 'BrandCodeValidator'; 