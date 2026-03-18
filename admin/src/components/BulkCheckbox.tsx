import { useRef, useEffect } from 'react';

interface BulkCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  disabled?: boolean;
  'aria-label'?: string;
}

/** Checkbox for bulk selection - supports indeterminate state for "select all" */
export function BulkCheckbox({
  checked,
  indeterminate = false,
  onChange,
  disabled = false,
  'aria-label': ariaLabel = 'Select',
}: BulkCheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      aria-label={ariaLabel}
      className="h-4 w-4 rounded border-accent-300 text-accent-600 focus:ring-accent-400"
    />
  );
}
