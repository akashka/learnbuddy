import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStaffProfile } from '@/contexts/StaffProfileContext';
import { useToast } from '@/contexts/ToastContext';
import { adminApi } from '@/lib/adminApi';
import { PhotoUpload } from '@/components/PhotoUpload';

export default function Profile() {
  const { user } = useAuth();
  const { profile, refetch } = useStaffProfile();
  const toast = useToast();
  const location = useLocation();

  useEffect(() => {
    if (location.hash === '#change-password') {
      document.getElementById('change-password')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location.hash]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState<string | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setPhone(profile.phone ?? '');
      setPhoto((profile as { photo?: string }).photo);
    }
  }, [profile]);

  const displayEmail = profile?.email ?? user?.email ?? '-';
  const displayRole = profile?.staffRole ?? user?.role ?? '-';
  const hasStaffRecord = (profile as { hasStaffRecord?: boolean })?.hasStaffRecord !== false;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasStaffRecord) return;
    setSaving(true);
    setSaveError(null);
    try {
      await adminApi.me.update({
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        photo: photo === undefined ? undefined : (photo || null),
      });
      toast.success('Profile updated');
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update';
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    setChangingPassword(true);
    try {
      await adminApi.me.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to change password';
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-bold text-accent-800">Admin Profile</h1>

      {/* Read-only info */}
      <div className="mb-6 rounded-xl border-2 border-accent-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-accent-800">Account info</h2>
        <dl className="space-y-3">
          <div>
            <dt className="text-sm font-medium text-accent-600">Email</dt>
            <dd className="text-accent-800">{displayEmail}</dd>
            <p className="mt-2 text-xs text-accent-500">
              Email cannot be changed by self. Contact an admin to update.
            </p>
          </div>
          <div>
            <dt className="text-sm font-medium text-accent-600">Role</dt>
            <dd className="text-accent-800">{displayRole}</dd>
            <p className="mt-2 text-xs text-accent-500">
              Role is managed by admins in the Users section.
            </p>
          </div>
        </dl>
      </div>

      {/* Editable info (staff only) */}
      {hasStaffRecord && (
        <div className="mb-6 rounded-xl border-2 border-accent-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-accent-800">Profile</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <PhotoUpload
              label="Profile photo"
              value={photo}
              onChange={setPhoto}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-accent-700">Display name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-lg border-2 border-accent-200 px-4 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-accent-700">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full rounded-lg border-2 border-accent-200 px-4 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
              />
            </div>
            {saveError && <p className="text-sm text-red-600">{saveError}</p>}
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          </form>
        </div>
      )}

      {!hasStaffRecord && (
        <div className="mb-6 rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            Profile editing is only available for staff accounts. Contact an admin to add you to the staff list.
          </p>
        </div>
      )}

      {/* Change password (always available) */}
      <div id="change-password" className="rounded-xl border-2 border-accent-200 bg-white p-6 scroll-mt-4">
        <h2 className="mb-4 text-lg font-semibold text-accent-800">Change password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-accent-700">Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border-2 border-accent-200 px-4 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-accent-700">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              placeholder="At least 6 characters"
              className="w-full rounded-lg border-2 border-accent-200 px-4 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-accent-700">Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border-2 border-accent-200 px-4 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
            />
          </div>
          {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
          <button
            type="submit"
            disabled={changingPassword}
            className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
          >
            {changingPassword ? 'Changing...' : 'Change password'}
          </button>
        </form>
      </div>
    </div>
  );
}
