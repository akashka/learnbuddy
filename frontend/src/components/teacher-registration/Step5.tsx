import { useState, useEffect, useMemo } from 'react';
import { apiJson } from '@/lib/api';

function getBatchStartDateBounds() {
  const today = new Date();
  const min = new Date(today);
  min.setDate(min.getDate() + 1);
  const max = new Date(today);
  max.setDate(max.getDate() + 30);
  return { min: min.toISOString().slice(0, 10), max: max.toISOString().slice(0, 10) };
}

interface Batch {
  name: string;
  board: string;
  classLevel: string;
  subject: string;
  minStudents: number;
  maxStudents: number;
  feePerMonth: number;
  slots: { day: string; startTime: string; endTime: string }[];
  startDate?: string;
}

interface MappingOption {
  board: string;
  classLevel: string;
  subject: string;
  label: string;
}

interface Step5Props {
  phone: string;
  onNext: (step: number, data?: Record<string, unknown>) => void;
  onBack: () => void;
  initialData: Record<string, unknown>;
  onSave: (step: number, data: Record<string, unknown>) => Promise<void>;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const WEEKEND = ['Sat', 'Sun'];
const DURATIONS = [
  { label: '30 mins', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '1.5 hours', minutes: 90 },
  { label: '2 hours', minutes: 120 },
];
// 48 slots = 24 hours × 2 (every 30 mins): 00:00 to 23:30
const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2) % 24;
  const m = (i % 2) * 30;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
});

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}`;
}

export default function TeacherStep5({ phone, onNext, onBack, initialData, onSave }: Step5Props) {
  const [mappingOptions, setMappingOptions] = useState<MappingOption[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const step2 = initialData?.step2 as { combinations?: { board: string; classLevel: string; subject: string }[] } | undefined;
    const step5 = initialData?.step5 as { batches?: Batch[] } | undefined;
    const hasInitial = (step2?.combinations && step2.combinations.length > 0) || (step5?.batches && step5.batches.length > 0);

    const buildOptionsFromCombinations = (combos: { board: string; classLevel: string; subject: string }[]) => {
      return combos.map((c) => ({
        board: c.board,
        classLevel: c.classLevel,
        subject: c.subject,
        label: `${c.board} | Class ${c.classLevel} | ${c.subject}`,
      }));
    };

    const ensureBatchStartDates = (b: Batch[]) =>
      b.map((batch) => ({
        ...batch,
        startDate: batch.startDate && batch.startDate >= getBatchStartDateBounds().min && batch.startDate <= getBatchStartDateBounds().max
          ? batch.startDate
          : getBatchStartDateBounds().min,
      }));

    if (hasInitial) {
      if (step2?.combinations) {
        setMappingOptions(buildOptionsFromCombinations(step2.combinations));
      }
      if (step5?.batches) setBatches(ensureBatchStartDates(step5.batches));
      setDataLoaded(true);
      return;
    }

    const loadData = async () => {
      const data = await apiJson<{ data?: { step2?: { combinations?: { board: string; classLevel: string; subject: string }[] }; step5?: { batches?: Batch[] } } }>(
        `/api/teacher-registration/data?phone=${encodeURIComponent(phone)}`
      );
      const combos = data.data?.step2?.combinations || [];
      const step5Batches = data.data?.step5?.batches || [];
      if (combos.length > 0) {
        setMappingOptions(combos.map((c) => ({
          board: c.board,
          classLevel: c.classLevel,
          subject: c.subject,
          label: `${c.board} | Class ${c.classLevel} | ${c.subject}`,
        })));
      }
      if (step5Batches.length > 0) {
        setBatches(ensureBatchStartDates(step5Batches));
      }
      setDataLoaded(true);
    };
    loadData();
  }, [phone, initialData]);

  const addBatch = () => {
    const firstMapping = mappingOptions[0];
    const board = firstMapping?.board || '—';
    const classLevel = firstMapping?.classLevel || '—';
    const subject = firstMapping?.subject || '—';
    const { min: defaultStartDate } = getBatchStartDateBounds();
    setBatches((prev) => [
      ...prev,
      {
        name: `Batch ${prev.length + 1}`,
        board,
        classLevel,
        subject,
        minStudents: 1,
        maxStudents: 3,
        feePerMonth: 2000,
        slots: [{ day: 'Mon', startTime: '10:00', endTime: '11:00' }],
        startDate: defaultStartDate,
      },
    ]);
  };

  const updateBatch = (idx: number, updates: Partial<Batch>) => {
    setBatches((prev) => {
      const b = [...prev];
      const current = b[idx];
      let next = { ...current, ...updates };
      if ('minStudents' in updates || 'maxStudents' in updates) {
        const min = next.minStudents ?? 1;
        const max = next.maxStudents ?? 3;
        if (min >= max) {
          if ('minStudents' in updates) next = { ...next, maxStudents: Math.min(min + 1, 3) };
          else next = { ...next, minStudents: Math.max(max - 1, 1) };
        }
        if ((next.minStudents ?? 1) <= 0) next = { ...next, minStudents: 1 };
        if ((next.maxStudents ?? 3) > 3) next = { ...next, maxStudents: 3 };
      }
      b[idx] = next;
      return b;
    });
  };

  const updateBatchMapping = (idx: number, value: string) => {
    const opt = mappingOptions.find((o) => o.label === value);
    if (opt) {
      updateBatch(idx, { board: opt.board, classLevel: opt.classLevel, subject: opt.subject });
    } else {
      const match = value.match(/^(.+?) \| Class (.+?) \| (.+)$/);
      if (match) {
        updateBatch(idx, { board: match[1], classLevel: match[2], subject: match[3] });
      }
    }
  };

  const applyDayPreset = (idx: number, preset: 'weekdays' | 'weekend', startTime = '10:00', duration = 60) => {
    const days = preset === 'weekdays' ? WEEKDAYS : WEEKEND;
    const slots = days.map((day) => ({
      day,
      startTime,
      endTime: addMinutes(startTime, duration),
    }));
    updateBatch(idx, { slots });
  };

  const setSlotsFromConfig = (
    idx: number,
    selectedDays: string[],
    timeMode: 'same' | 'different',
    sameStartTime: string,
    sameDuration: number,
    perDay: Record<string, { startTime: string; duration: number }>
  ) => {
    const slots =
      timeMode === 'same'
        ? selectedDays.map((day) => ({
            day,
            startTime: sameStartTime,
            endTime: addMinutes(sameStartTime, sameDuration),
          }))
        : selectedDays.map((day) => {
            const p = perDay[day] || { startTime: '10:00', duration: 60 };
            return {
              day,
              startTime: p.startTime,
              endTime: addMinutes(p.startTime, p.duration),
            };
          });
    updateBatch(idx, { slots });
  };

  const validateBatches = (): string | null => {
    const { min: minDate, max: maxDate } = getBatchStartDateBounds();
    for (let i = 0; i < batches.length; i++) {
      const b = batches[i];
      if (!b.name?.trim()) return `Batch ${i + 1}: Batch name is required`;
      if (!b.board || b.board === '—' || !b.classLevel || b.classLevel === '—' || !b.subject || b.subject === '—') {
        return `Batch ${i + 1}: Board – Class – Subject is required`;
      }
      if (!b.feePerMonth || b.feePerMonth <= 0) return `Batch ${i + 1}: Fee must be greater than 0`;
      if (!b.minStudents || b.minStudents <= 0) return `Batch ${i + 1}: Min students must be greater than 0`;
      if (!b.maxStudents || b.maxStudents > 3) return `Batch ${i + 1}: Max students must be 1–3`;
      if (b.minStudents >= b.maxStudents) return `Batch ${i + 1}: Min students must be less than max students`;
      if (!b.startDate) return `Batch ${i + 1}: Batch starting date is required`;
      if (b.startDate < minDate) return `Batch ${i + 1}: Start date must be at least tomorrow`;
      if (b.startDate > maxDate) return `Batch ${i + 1}: Start date must be within 30 days from today`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent, skip: boolean) => {
    e.preventDefault();
    if (!skip && batches.length > 0) {
      const err = validateBatches();
      if (err) {
        alert(err);
        return;
      }
    }
    setLoading(true);
    try {
      await onSave(5, skip ? {} : { batches });
      if (skip) {
        onNext(6, { skippedStep5: true });
      } else {
        const data = await apiJson<{ token?: string; user?: { id: string; email: string; role: string }; teacherName?: string; error?: string }>(
          '/api/teacher-registration/complete',
          { method: 'POST', body: JSON.stringify({ phone }) }
        );
        if (data.error) throw new Error(data.error);
        onNext(6, {
          registrationComplete: true,
          token: data.token,
          user: data.user,
          teacherName: data.teacherName,
        });
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  const handleBack = async () => {
    if (batches.length > 0) {
      setLoading(true);
      try {
        await onSave(5, { batches });
      } catch {
        // ignore
      }
      setLoading(false);
    }
    onBack();
  };

  return (
    <div className="rounded-3xl border-2 border-brand-200 bg-white p-8 shadow-xl">
      <h2 className="mb-6 text-xl font-bold text-brand-800">Step 5: Create Batches</h2>
      <p className="mb-6 text-base text-brand-600">
        Create batches for your teaching. Select board-class-subject, schedule days, and timings. You can skip and add later from your profile.
      </p>

      {batches.length === 0 && (
        <div className="mb-6">
          {!dataLoaded ? (
            <p className="text-gray-600">Loading...</p>
          ) : mappingOptions.length === 0 ? (
            <p className="mb-3 text-amber-700">No teaching combinations found. Go back to Step 2 to add them first.</p>
          ) : null}
          <button type="button" onClick={addBatch} className="btn-primary" disabled={!dataLoaded || mappingOptions.length === 0}>
            <span className="btn-text">Add First Batch</span>
          </button>
        </div>
      )}

      {batches.map((batch, idx) => (
        <BatchForm
          key={idx}
          batch={batch}
          idx={idx}
          mappingOptions={mappingOptions}
          updateBatch={updateBatch}
          updateBatchMapping={updateBatchMapping}
          applyDayPreset={applyDayPreset}
          setSlotsFromConfig={setSlotsFromConfig}
        />
      ))}

      {batches.length > 0 && (
        <button type="button" onClick={addBatch} className="btn-secondary mb-6">
          <span className="btn-text">Add Another Batch</span>
        </button>
      )}

      <div className="flex gap-4">
        <button type="button" onClick={handleBack} disabled={loading} className="btn-secondary">
          <span className="btn-text">Back</span>
        </button>
        <button type="button" onClick={(e) => handleSubmit(e as unknown as React.FormEvent, false)} disabled={loading} className="btn-primary flex-1">
          <span className="btn-text">{loading ? 'Saving...' : 'Complete Registration'}</span>
        </button>
        <button type="button" onClick={(e) => handleSubmit(e as unknown as React.FormEvent, true)} disabled={loading} className="btn-secondary">
          <span className="btn-text">Skip for Now</span>
        </button>
      </div>
    </div>
  );
}

interface BatchFormProps {
  batch: Batch;
  idx: number;
  mappingOptions: MappingOption[];
  updateBatch: (idx: number, updates: Partial<Batch>) => void;
  updateBatchMapping: (idx: number, value: string) => void;
  applyDayPreset: (idx: number, preset: 'weekdays' | 'weekend', startTime?: string, duration?: number) => void;
  setSlotsFromConfig: (
    idx: number,
    days: string[],
    timeMode: 'same' | 'different',
    sameStartTime: string,
    sameDuration: number,
    perDay: Record<string, { startTime: string; duration: number }>
  ) => void;
}

function BatchForm({
  batch,
  idx,
  mappingOptions,
  updateBatch,
  updateBatchMapping,
  applyDayPreset,
  setSlotsFromConfig,
}: BatchFormProps) {
  const [selectedDays, setSelectedDays] = useState<string[]>(batch.slots.map((s) => s.day));
  const [timeMode, setTimeMode] = useState<'same' | 'different'>('same');
  const [sameStartTime, setSameStartTime] = useState(batch.slots[0]?.startTime || '10:00');
  const [sameDuration, setSameDuration] = useState(60);
  const [perDayTimes, setPerDayTimes] = useState<Record<string, { startTime: string; duration: number }>>(() => {
    const r: Record<string, { startTime: string; duration: number }> = {};
    batch.slots.forEach((s) => {
      const [sh, sm] = s.startTime.split(':').map(Number);
      const [eh, em] = s.endTime.split(':').map(Number);
      r[s.day] = { startTime: s.startTime, duration: (eh * 60 + em) - (sh * 60 + sm) };
    });
    return r;
  });

  const toggleDay = (day: string) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const applyAndSaveSlots = () => {
    if (selectedDays.length === 0) return;
    setSlotsFromConfig(idx, selectedDays, timeMode, sameStartTime, sameDuration, perDayTimes);
  };

  const mappingLabel = `${batch.board} | Class ${batch.classLevel} | ${batch.subject}`;
  const mappingOptionsWithCurrent = useMemo(() => {
    const hasCurrent = mappingOptions.some(
      (o) => o.board === batch.board && o.classLevel === batch.classLevel && o.subject === batch.subject
    );
    if (hasCurrent) return mappingOptions;
    return [{ board: batch.board, classLevel: batch.classLevel, subject: batch.subject, label: mappingLabel }, ...mappingOptions];
  }, [mappingOptions, batch.board, batch.classLevel, batch.subject, mappingLabel]);

  useEffect(() => {
    setSelectedDays(batch.slots.map((s) => s.day));
    if (batch.slots.length > 0) {
      setSameStartTime(batch.slots[0].startTime);
      setSameDuration((() => {
        const [sh, sm] = batch.slots[0].startTime.split(':').map(Number);
        const [eh, em] = batch.slots[0].endTime.split(':').map(Number);
        return (eh * 60 + em) - (sh * 60 + sm);
      })());
      const perDay: Record<string, { startTime: string; duration: number }> = {};
      batch.slots.forEach((s) => {
        const [sh, sm] = s.startTime.split(':').map(Number);
        const [eh, em] = s.endTime.split(':').map(Number);
        perDay[s.day] = { startTime: s.startTime, duration: (eh * 60 + em) - (sh * 60 + sm) };
      });
      setPerDayTimes(perDay);
    }
  }, [batch.slots]);

  return (
    <div className="mb-6 rounded-xl border-2 border-brand-100 p-4">
      <h3 className="mb-4 font-semibold">Batch {idx + 1}</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Board – Class – Subject <span className="text-red-600">*</span></label>
          <select
            value={mappingLabel}
            onChange={(e) => updateBatchMapping(idx, e.target.value)}
            className={`w-full rounded-lg border-2 px-3 py-2 ${!batch.board || batch.board === '—' ? 'border-red-400' : 'border-brand-200'}`}
          >
            {mappingOptionsWithCurrent.map((opt) => (
              <option key={opt.label} value={opt.label}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Batch Name <span className="text-red-600">*</span></label>
          <input
            type="text"
            value={batch.name}
            onChange={(e) => updateBatch(idx, { name: e.target.value })}
            placeholder="e.g. Morning Batch"
            className={`w-full rounded-lg border-2 px-3 py-2 ${!batch.name?.trim() ? 'border-red-400' : 'border-brand-200'}`}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Fee per month (₹) <span className="text-red-600">*</span></label>
          <input
            type="number"
            min={1}
            value={batch.feePerMonth}
            onChange={(e) => updateBatch(idx, { feePerMonth: parseInt(e.target.value) || 0 })}
            className={`w-full rounded-lg border-2 px-3 py-2 ${!batch.feePerMonth || batch.feePerMonth <= 0 ? 'border-red-400' : 'border-brand-200'}`}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Batch starting date <span className="text-red-600">*</span></label>
          <input
            type="date"
            value={batch.startDate || getBatchStartDateBounds().min}
            onChange={(e) => updateBatch(idx, { startDate: e.target.value })}
            min={getBatchStartDateBounds().min}
            max={getBatchStartDateBounds().max}
            className={`w-full rounded-lg border-2 px-3 py-2 ${!batch.startDate ? 'border-red-400' : 'border-brand-200'}`}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Min Students <span className="text-red-600">*</span></label>
          <input
            type="number"
            min={1}
            max={batch.maxStudents <= 1 ? 1 : batch.maxStudents - 1}
            value={batch.minStudents}
            onChange={(e) => updateBatch(idx, { minStudents: parseInt(e.target.value) || 1 })}
            className={`w-full rounded-lg border-2 px-3 py-2 ${
              batch.minStudents <= 0 || batch.minStudents >= batch.maxStudents ? 'border-red-400' : 'border-brand-200'
            }`}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Max Students (1–3) <span className="text-red-600">*</span></label>
          <input
            type="number"
            min={Math.max(batch.minStudents + 1, 1)}
            max={3}
            value={batch.maxStudents}
            onChange={(e) => updateBatch(idx, { maxStudents: parseInt(e.target.value) || 1 })}
            className={`w-full rounded-lg border-2 px-3 py-2 ${
              batch.maxStudents <= batch.minStudents || batch.maxStudents > 3 ? 'border-red-400' : 'border-brand-200'
            }`}
          />
        </div>
      </div>
      <div className="mt-4 rounded-lg border-2 border-brand-50 bg-brand-50/30 p-4">
        <label className="mb-2 block text-sm font-medium">Schedule</label>
        <div className="mb-3">
          <span className="mr-2 text-sm font-medium">Quick presets:</span>
          <button
            type="button"
            onClick={() => {
              setSelectedDays(WEEKDAYS);
              setTimeMode('same');
              setSameStartTime('10:00');
              setSameDuration(60);
              applyDayPreset(idx, 'weekdays', '10:00', 60);
            }}
            className="mr-2 rounded-lg bg-brand-100 px-3 py-1 text-sm text-brand-800 hover:bg-brand-200"
          >
            Weekdays
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedDays(WEEKEND);
              setTimeMode('same');
              setSameStartTime('10:00');
              setSameDuration(60);
              applyDayPreset(idx, 'weekend', '10:00', 60);
            }}
            className="rounded-lg bg-brand-100 px-3 py-1 text-sm text-brand-800 hover:bg-brand-200"
          >
            Weekend
          </button>
        </div>
        <div className="mb-3">
          <span className="mb-2 block text-sm font-medium">Select days (multiselect)</span>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => (
              <label
                key={day}
                className={`flex cursor-pointer items-center rounded-lg border-2 px-3 py-2 text-sm ${
                  selectedDays.includes(day) ? 'border-brand-500 bg-brand-100' : 'border-gray-200 bg-white'
                }`}
              >
                <input type="checkbox" checked={selectedDays.includes(day)} onChange={() => toggleDay(day)} className="mr-2" />
                {day}
              </label>
            ))}
          </div>
        </div>
        <div className="mb-3">
          <span className="mb-2 block text-sm font-medium">Time mode</span>
          <div className="flex gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input type="radio" name={`timeMode-${idx}`} checked={timeMode === 'same'} onChange={() => setTimeMode('same')} />
              Same time for all days
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input type="radio" name={`timeMode-${idx}`} checked={timeMode === 'different'} onChange={() => setTimeMode('different')} />
              Different time per day
            </label>
          </div>
        </div>
        {timeMode === 'same' && (
          <div className="mb-3 flex flex-wrap items-center gap-4">
            <div>
              <label className="mb-1 block text-xs">Time from</label>
              <select value={sameStartTime} onChange={(e) => setSameStartTime(e.target.value)} className="rounded-lg border-2 border-brand-200 px-3 py-2">
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs">Duration</label>
              <select value={sameDuration} onChange={(e) => setSameDuration(Number(e.target.value))} className="rounded-lg border-2 border-brand-200 px-3 py-2">
                {DURATIONS.map((d) => (
                  <option key={d.minutes} value={d.minutes}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        {timeMode === 'different' && selectedDays.length > 0 && (
          <div className="mb-3 space-y-2">
            {selectedDays.map((day) => (
              <div key={day} className="flex flex-wrap items-center gap-2 rounded-lg bg-white p-2">
                <span className="w-12 font-medium">{day}</span>
                <select
                  value={perDayTimes[day]?.startTime || '10:00'}
                  onChange={(e) =>
                    setPerDayTimes((prev) => ({
                      ...prev,
                      [day]: { ...prev[day], startTime: e.target.value, duration: prev[day]?.duration || 60 },
                    }))
                  }
                  className="rounded border px-2 py-1 text-sm"
                >
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <span className="text-sm">to</span>
                <select
                  value={perDayTimes[day]?.duration || 60}
                  onChange={(e) =>
                    setPerDayTimes((prev) => ({
                      ...prev,
                      [day]: { ...prev[day], startTime: prev[day]?.startTime || '10:00', duration: Number(e.target.value) },
                    }))
                  }
                  className="rounded border px-2 py-1 text-sm"
                >
                  {DURATIONS.map((d) => (
                    <option key={d.minutes} value={d.minutes}>{d.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
        <button type="button" onClick={applyAndSaveSlots} disabled={selectedDays.length === 0} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 disabled:opacity-50">
          Apply schedule
        </button>
        {batch.slots.length > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            Current: {batch.slots.map((s) => `${s.day} ${s.startTime}-${s.endTime}`).join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}
