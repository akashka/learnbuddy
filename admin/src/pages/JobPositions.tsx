import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { DataState } from '@/components/DataState';

type JobPosition = {
  id: string;
  title: string;
  team: string;
  type: string;
  location: string;
  description: string;
  jdUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  applicationsCount?: number;
};

export default function JobPositions() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [positions, setPositions] = useState<JobPosition[]>([]);

  const fetchPositions = () => {
    setLoading(true);
    adminApi.jobPositions
      .list()
      .then((d) => setPositions(d.positions))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-accent-800">Job Positions</h1>
          <p className="mt-1 text-sm text-accent-700">
            Manage open positions shown on the Careers page. Add JD (PDF, max 25MB) and track applications.
          </p>
        </div>
        <Link
          to="/job-positions/new"
          className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-700"
        >
          Add position
        </Link>
      </div>

      <DataState loading={loading} error={error}>
        {positions.length > 0 && (
          <div className="space-y-2">
            {positions.map((p) => (
              <Link
                key={p.id}
                to={`/job-positions/${p.id}`}
                className="flex items-center justify-between rounded-lg border border-accent-200 bg-white p-4 transition hover:bg-accent-50"
              >
                <div>
                  <span className="font-medium text-accent-800">{p.title}</span>
                  <span className="ml-2 text-sm text-accent-600">
                    {p.team} • {p.type} • {p.location}
                  </span>
                  {p.jdUrl && (
                    <span className="ml-2 rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      JD
                    </span>
                  )}
                  <span
                    className={`ml-2 rounded px-2 py-0.5 text-xs font-medium ${
                      p.status === 'open' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {p.status}
                  </span>
                  {typeof p.applicationsCount === 'number' && p.applicationsCount > 0 && (
                    <span className="ml-2 rounded bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                      {p.applicationsCount} applicant{p.applicationsCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <span className="text-sm text-accent-600">
                  Updated {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '-'}
                </span>
              </Link>
            ))}
          </div>
        )}
        {!loading && !error && positions.length === 0 && (
          <p className="text-accent-600">No job positions yet. Add one to get started.</p>
        )}
      </DataState>
    </div>
  );
}
