import { useState, useEffect } from 'react';
import { apiJson } from '@/lib/api';
import { useAutoSelectSingleOption } from '@/hooks/useAutoSelectSingleOption';

interface Combination {
  board: string;
  classLevel: string;
  subject: string;
}

interface Step2Props {
  phone: string;
  onNext: (step: number, data?: Record<string, unknown>) => void;
  onBack: () => void;
  initialData: Record<string, unknown>;
  onSave: (step: number, data: Record<string, unknown>) => Promise<void>;
}

export default function TeacherStep2({ phone, onNext, onBack, onSave, initialData }: Step2Props) {
  const [boards, setBoards] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [combinations, setCombinations] = useState<Combination[]>([]);
  const [selectedBoard, setSelectedBoard] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  useEffect(() => {
    apiJson<{ boards?: string[]; classes?: string[] }>('/api/board-class-subjects')
      .then((data) => {
        setBoards(data.boards || []);
        setClasses(data.classes || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedBoard && selectedClass) {
      apiJson<{ subjects?: string[] }>(
        `/api/board-class-subjects?board=${encodeURIComponent(selectedBoard)}&class=${selectedClass}`
      )
        .then((data) => setAvailableSubjects(data.subjects || []))
        .catch(() => setAvailableSubjects([]));
    } else {
      setAvailableSubjects([]);
    }
  }, [selectedBoard, selectedClass]);

  useEffect(() => {
    const step2 = initialData as { combinations?: Combination[] } | undefined;
    if (step2?.combinations?.length) {
      setCombinations(step2.combinations);
      return;
    }
    const loadData = async () => {
      try {
        const data = await apiJson<{ data?: { step2?: { combinations?: Combination[] } } }>(
          `/api/teacher-registration/data?phone=${encodeURIComponent(phone)}`
        );
        if (data.data?.step2?.combinations) {
          setCombinations(data.data.step2.combinations);
        }
      } catch {
        // ignore
      }
    };
    loadData();
  }, [phone, initialData]);

  useAutoSelectSingleOption(selectedBoard, setSelectedBoard, boards);
  useAutoSelectSingleOption(selectedClass, setSelectedClass, classes);

  const toggleSubject = (sub: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const addCombination = () => {
    if (!selectedBoard || !selectedClass || selectedSubjects.length === 0) return;
    selectedSubjects.forEach((subject) => {
      if (!combinations.some((c) => c.board === selectedBoard && c.classLevel === selectedClass && c.subject === subject)) {
        setCombinations((prev) => [...prev, { board: selectedBoard, classLevel: selectedClass, subject }]);
      }
    });
    setSelectedSubjects([]);
  };

  const removeCombination = (idx: number) => {
    setCombinations((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (combinations.length === 0) return;
    setLoading(true);
    try {
      await onSave(2, { combinations });
      onNext(3, { combinations });
    } catch {
      // ignore
    }
    setLoading(false);
  };

  const handleBack = async () => {
    if (combinations.length > 0) {
      setLoading(true);
      try {
        await onSave(2, { combinations });
      } catch {
        // ignore
      }
      setLoading(false);
    }
    onBack();
  };

  return (
    <div className="rounded-3xl border-2 border-brand-200 bg-white p-8 shadow-xl">
      <h2 className="mb-6 text-xl font-bold text-brand-800">Step 2: Teaching Details</h2>
      <p className="mb-6 text-base text-brand-600">Select board, class and subjects you wish to teach. You can add multiple combinations.</p>

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="min-w-[120px] flex-1">
          <label className="mb-2 block font-semibold">Board</label>
          <select
            value={selectedBoard}
            onChange={(e) => setSelectedBoard(e.target.value)}
            className="w-full rounded-xl border-2 border-brand-200 px-4 py-3"
          >
            <option value="">Select Board</option>
            {boards.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[120px] flex-1">
          <label className="mb-2 block font-semibold">Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full rounded-xl border-2 border-brand-200 px-4 py-3"
          >
            <option value="">Select Class</option>
            {classes.map((c) => (
              <option key={c} value={c}>Class {c}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedBoard && selectedClass && availableSubjects.length > 0 && (
        <div className="mb-6">
          <label className="mb-2 block font-semibold">Select subjects to add</label>
          <div className="flex flex-wrap gap-2">
            {availableSubjects.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => toggleSubject(sub)}
                className={`rounded-xl px-3 py-1 text-sm transition ${
                  selectedSubjects.includes(sub) ? 'bg-brand-500 text-white' : 'bg-brand-100 text-brand-800 hover:bg-brand-200'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={addCombination}
            disabled={selectedSubjects.length === 0}
            className="btn-primary mt-2"
          >
            <span className="btn-text">Add {selectedSubjects.length} subject(s)</span>
          </button>
        </div>
      )}

      {combinations.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 font-semibold">Selected combinations ({combinations.length})</h3>
          <div className="flex flex-wrap gap-2">
            {combinations.map((c, i) => (
              <span
                key={i}
                className="flex items-center gap-1 rounded-xl bg-brand-100 px-3 py-1 text-sm"
              >
                {c.board} | Class {c.classLevel} | {c.subject}
                <button type="button" onClick={() => removeCombination(i)} className="ml-1 text-red-600 hover:underline">
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-4">
        <button type="button" onClick={handleBack} disabled={loading} className="btn-secondary">
          <span className="btn-text">Back</span>
        </button>
        <button
          type="submit"
          disabled={loading || combinations.length === 0}
          className="btn-primary flex-1 disabled:opacity-50"
        >
          <span className="btn-text">{loading ? 'Saving...' : 'Continue to Exam'}</span>
        </button>
      </form>
    </div>
  );
}
