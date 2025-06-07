import { useState } from 'react';
import type { ZodSchema } from 'zod';

interface UseElemtSubmitProbs<T> {
  onSuccess: (success: string) => void;
  onError: (error: string) => void;
  schema: ZodSchema<T>;
  onSave: (data: T) => void;
  onClose: () => void;
  createFn: (data: T) => void;
  updateFn: (data: T) => void;
}
export function useElementSubmit<T extends { id?: string }>({
  onSuccess,
  onError,
  onSave,
  onClose,
  createFn,
  updateFn,
  schema,
}: UseElemtSubmitProbs<T>) {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const handleSave = async (element: T | null) => {
    console.log('save in submit');
    console.log('element startL ', element);
    if (!element) return;

    const parsed = validateInput(element);
    console.log('parse: ', parsed);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof T, string>> = {};
      parsed.error.errors.forEach(err => {
        const field = err.path[0] as keyof T;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      console.log('element: ', element);
      if (element.id) {
        await updateFn(parsed.data);
        onSuccess?.('Update successfully!');
      } else {
        console.log('hello create');
        await createFn(parsed.data);
        onSuccess?.('Create successfully!');
      }

      onSave(parsed.data);
      onClose();
    } catch (error: any) {
      onError?.('Something went wrong: ' + error);
    }

    onClose;
  };

  const validateInput = (data: T) => {
    return schema.safeParse({
      ...data,
    });
  };

  return {
    handleSave,
    errors,
  };
}
