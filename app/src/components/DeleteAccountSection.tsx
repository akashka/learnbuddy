import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { apiJson } from '../lib/api';
import { colors, spacing, typography } from '../theme';

interface Child {
  _id: string;
  name?: string;
  studentId?: string;
}

interface DeleteAccountSectionProps {
  role: 'parent' | 'teacher';
  onDeleted: () => void;
}

const WARNING = `Deleting your data is permanent and cannot be undone.

• All payments made will be lost – no refunds
• You will not be able to log in again
• You will have to start fresh if you want to use the platform again
• All class history, enrollments, and progress will be lost
• For parents: Deleting your account also deletes all your children's data`;

export function DeleteAccountSection({ role, onDeleted }: DeleteAccountSectionProps) {
  const [step, setStep] = useState<'idle' | 'confirm' | 'otp'>('idle');
  const [scope, setScope] = useState<'full' | 'students'>('full');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (role === 'parent' && step === 'confirm') {
      apiJson<{ children: Child[] }>('/api/parent/students')
        .then((r) => setChildren(r.children || []))
        .catch(() => setChildren([]));
    }
  }, [role, step]);

  const handleRequestDelete = async () => {
    setError('');
    setLoading(true);
    try {
      const body = scope === 'students' && selectedStudents.length > 0
        ? { scope: 'students', studentIds: selectedStudents }
        : { scope: 'full' };
      const res = await apiJson<{ devOtp?: string }>('/api/account/delete-request', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (res.devOtp) {
        Alert.alert('OTP (dev)', `Your OTP: ${res.devOtp}`);
      }
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setError('');
    setLoading(true);
    try {
      await apiJson('/api/account/delete-confirm', {
        method: 'POST',
        body: JSON.stringify({ otp: otp.trim() }),
      });
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delete Account / Data</Text>
      <Text style={styles.hint}>This action is irreversible.</Text>

      {step === 'idle' && (
        <TouchableOpacity style={styles.deleteBtn} onPress={() => setStep('confirm')}>
          <Text style={styles.deleteBtnText}>I want to delete my data</Text>
        </TouchableOpacity>
      )}

      {step === 'confirm' && (
        <View style={styles.step}>
          <Text style={styles.warning}>{WARNING}</Text>
          {role === 'parent' && children.length > 0 && (
            <View style={styles.options}>
              <TouchableOpacity style={styles.radioRow} onPress={() => setScope('full')}>
                <View style={[styles.radio, scope === 'full' && styles.radioSelected]} />
                <Text style={styles.radioLabel}>My complete account and all children&apos;s data</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.radioRow} onPress={() => setScope('students')}>
                <View style={[styles.radio, scope === 'students' && styles.radioSelected]} />
                <Text style={styles.radioLabel}>Only specific children</Text>
              </TouchableOpacity>
              {scope === 'students' && (
                <View style={styles.checkboxes}>
                  {children.map((c) => (
                    <TouchableOpacity
                      key={c._id}
                      style={styles.checkRow}
                      onPress={() => toggleStudent(c._id)}
                    >
                      <View style={[styles.checkbox, selectedStudents.includes(c._id) && styles.checkboxSelected]} />
                      <Text style={styles.checkLabel}>{c.name || c.studentId}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.confirmBtn, (loading || (scope === 'students' && selectedStudents.length === 0)) && styles.disabled]}
              onPress={handleRequestDelete}
              disabled={loading || (scope === 'students' && selectedStudents.length === 0)}
            >
              <Text style={styles.confirmBtnText}>{loading ? 'Sending...' : 'Send OTP'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setStep('idle'); setError(''); }}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {step === 'otp' && (
        <View style={styles.step}>
          <Text style={styles.otpHint}>Enter the 6-digit OTP sent to your phone</Text>
          <TextInput
            style={styles.otpInput}
            value={otp}
            onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={6}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.confirmBtn, (loading || otp.length !== 6) && styles.disabled]}
              onPress={handleConfirmDelete}
              disabled={loading || otp.length !== 6}
            >
              <Text style={styles.confirmBtnText}>{loading ? 'Deleting...' : 'Confirm & Delete'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setStep('confirm'); setOtp(''); setError(''); }}>
              <Text style={styles.cancelBtnText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, backgroundColor: '#fef2f2', borderRadius: 12, borderWidth: 1, borderColor: '#fecaca' },
  title: { ...typography.body, fontWeight: '600', color: '#991b1b', marginBottom: spacing.xs },
  hint: { ...typography.caption, color: '#b91c1c', marginBottom: spacing.md },
  deleteBtn: { padding: spacing.md, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#fca5a5' },
  deleteBtnText: { ...typography.body, color: '#b91c1c', textAlign: 'center' },
  step: { marginTop: spacing.sm },
  warning: { ...typography.bodySmall, color: '#7f1d1d', marginBottom: spacing.md },
  options: { marginBottom: spacing.md },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#b91c1c', marginRight: spacing.sm },
  radioSelected: { backgroundColor: '#b91c1c' },
  radioLabel: { ...typography.bodySmall, flex: 1 },
  checkboxes: { marginLeft: spacing.lg, marginTop: spacing.sm },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: '#b91c1c', marginRight: spacing.sm },
  checkboxSelected: { backgroundColor: '#b91c1c' },
  checkLabel: { ...typography.bodySmall },
  errorText: { ...typography.caption, color: colors.error, marginBottom: spacing.sm },
  otpHint: { ...typography.bodySmall, marginBottom: spacing.sm },
  otpInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.md, fontSize: 24, textAlign: 'center', marginBottom: spacing.md },
  buttons: { flexDirection: 'row', gap: spacing.sm },
  confirmBtn: { flex: 1, padding: spacing.md, backgroundColor: '#b91c1c', borderRadius: 8 },
  confirmBtnText: { ...typography.button, color: '#fff', textAlign: 'center' },
  cancelBtn: { padding: spacing.md, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  cancelBtnText: { ...typography.body, color: colors.text },
  disabled: { opacity: 0.5 },
});
