import { useState } from 'react';
import { CmsContentInModal } from './CmsContentInModal';

interface PolicyTermsCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}

export function PolicyTermsCheckbox({ checked, onChange, error }: PolicyTermsCheckboxProps) {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  return (
    <div className="space-y-2">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
        />
        <span className="text-base text-gray-700">
          I accept the{' '}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setPrivacyOpen(true);
            }}
            className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700"
          >
            Privacy Policy
          </button>
          {' '}and{' '}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setTermsOpen(true);
            }}
            className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700"
          >
            Terms & Conditions
          </button>
        </span>
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <CmsContentInModal
        slug="privacy-policy"
        title="Privacy Policy"
        isOpen={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
      />
      <CmsContentInModal
        slug="terms-conditions"
        title="Terms & Conditions"
        isOpen={termsOpen}
        onClose={() => setTermsOpen(false)}
      />
    </div>
  );
}
