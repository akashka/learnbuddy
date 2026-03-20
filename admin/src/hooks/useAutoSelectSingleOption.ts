import { useEffect } from 'react';

function defaultIsEmpty<T>(v: T): boolean {
  return (v as unknown) === '' || v === undefined;
}

/**
 * Auto-selects the single option when a select/dropdown has only one real option.
 * Improves UX by avoiding an extra click when there's no real choice.
 *
 * @param value - Current selected value
 * @param setValue - State setter for the value
 * @param options - Array of available options (excluding placeholder)
 * @param isEmpty - Optional predicate to check if value is "empty". Default: '' or undefined.
 */
export function useAutoSelectSingleOption<T>(
  value: T,
  setValue: (v: T) => void,
  options: T[],
  isEmpty: (v: T) => boolean = defaultIsEmpty
): void {
  useEffect(() => {
    if (options.length === 1 && isEmpty(value)) {
      setValue(options[0]);
    }
  }, [options, value, setValue, isEmpty]);
}
