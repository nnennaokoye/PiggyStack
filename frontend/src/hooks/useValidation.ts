import { useState, useCallback } from 'react';
import { isAddress } from 'viem';

interface ValidationRules {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  isAddress?: boolean;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
}

interface ValidationErrors {
  [key: string]: string;
}

export function useValidation<T extends Record<string, any>>(
  initialValues: T,
  rules: Record<keyof T, ValidationRules>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);

  const validateField = useCallback(
    (name: keyof T, value: any) => {
      const fieldRules = rules[name];
      if (!fieldRules) return '';

      if (fieldRules.required && !value) {
        return 'This field is required';
      }

      if (value) {
        if (fieldRules.min !== undefined && value < fieldRules.min) {
          return `Minimum value is ${fieldRules.min}`;
        }

        if (fieldRules.max !== undefined && value > fieldRules.max) {
          return `Maximum value is ${fieldRules.max}`;
        }

        if (fieldRules.minLength !== undefined && value.length < fieldRules.minLength) {
          return `Minimum length is ${fieldRules.minLength}`;
        }

        if (fieldRules.maxLength !== undefined && value.length > fieldRules.maxLength) {
          return `Maximum length is ${fieldRules.maxLength}`;
        }

        if (fieldRules.isAddress && !isAddress(value)) {
          return 'Invalid Ethereum address';
        }

        if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
          return 'Invalid format';
        }

        if (fieldRules.custom && !fieldRules.custom(value)) {
          return 'Invalid value';
        }
      }

      return '';
    },
    [rules]
  );

  const handleChange = useCallback(
    (name: keyof T, value: any) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [validateField]
  );

  const handleBlur = useCallback(
    (name: keyof T) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      const error = validateField(name, values[name]);
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [validateField, values]
  );

  const validateAll = useCallback(() => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.keys(rules).forEach((key) => {
      const error = validateField(key as keyof T, values[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [rules, validateField, values]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({} as Record<keyof T, boolean>);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
  };
} 