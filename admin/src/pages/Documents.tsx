import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/contexts/ToastContext';
import { DataState } from '@/components/DataState';
import { API_BASE } from '@/lib/api';

type Folder = { id: string; name: string; parentId: string | null; allowedRoles: string[] };
type Doc = {
  id: string;
  name: string;
  folderId: string | null;
  category: string;
  allowedRoles: string[];
  versionCount: number;
  latestVersion: { version: number; uploadedAt: string; url: string; originalFilename: string } | null;
};

const ROLE_OPTIONS = ['admin', 'teacher', 'parent', 'student'];
const CATEGORY_OPTIONS = ['General', 'Documentation', 'Policy', 'Guide', 'API', 'Other'];

/** File extensions that can be previewed inline */
const PREVIEWABLE_EXT = [
  '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',
  '.txt', '.md', '.html', '.json', '.xml', '.csv',
];

function getFileIcon(filename: string): string {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  if (['pdf'].includes(ext)) return '📄';
  if (['doc', 'docx'].includes(ext)) return '📝';
  if (['xls', 'xlsx'].includes(ext)) return '📊';
  if (['ppt', 'pptx'].includes(ext)) return '📽️';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return '🖼️';
  if (['txt', 'md', 'csv'].includes(ext)) return '📃';
  return '📎';
}

function canPreview(url: string): boolean {
  const ext = (url.split('.').pop() || '').split('?')[0].toLowerCase();
  return PREVIEWABLE_EXT.some((e) => e.slice(1) === ext);
}

export default function Documents() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolderName, setCurrentFolderName] = useState<string>('');

  const [showAddDoc, setShowAddDoc] = useState(false);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [viewDoc, setViewDoc] = useState<Doc | null>(null);
  const [docDetail, setDocDetail] = useState<{
    versions: { version: number; uploadedAt: string; url: string; originalFilename: string }[];
    latestVersion: { version: number; uploadedAt: string; url: string; originalFilename: string } | null;
  } | null>(null);
  const [addDocName, setAddDocName] = useState('');
  const [addDocCategory, setAddDocCategory] = useState('General');
  const [addDocRoles, setAddDocRoles] = useState<string[]>(['admin', 'teacher', 'parent', 'student']);
  const [addDocFile, setAddDocFile] = useState<File | null>(null);
  const [addDocError, setAddDocError] = useState<string | null>(null);
  const [creatingDoc, setCreatingDoc] = useState(false);

  const [addFolderName, setAddFolderName] = useState('');
  const [addFolderRoles, setAddFolderRoles] = useState<string[]>(['admin', 'teacher', 'parent', 'student']);
  const [addFolderError, setAddFolderError] = useState<string | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);

  const [uploadVersionFile, setUploadVersionFile] = useState<File | null>(null);
  const [uploadingVersion, setUploadingVersion] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    adminApi.documents
      .list({ folderId: currentFolderId || undefined })
      .then((d) => {
        setFolders(d.folders);
        setDocuments(d.documents);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [currentFolderId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addDocName.trim()) {
      setAddDocError('Document name is required');
      return;
    }
    if (!addDocFile || addDocFile.size === 0) {
      setAddDocError('Please select a file to upload');
      return;
    }
    setCreatingDoc(true);
    setAddDocError(null);
    try {
      const formData = new FormData();
      formData.append('name', addDocName.trim());
      formData.append('category', addDocCategory);
      formData.append('allowedRoles', addDocRoles.join(','));
      formData.append('file', addDocFile);
      if (currentFolderId) formData.append('folderId', currentFolderId);
      await adminApi.documents.create(formData);
      toast.success('Document created');
      setShowAddDoc(false);
      setAddDocName('');
      setAddDocFile(null);
      fetchData();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create';
      setAddDocError(msg);
      toast.error(msg);
    } finally {
      setCreatingDoc(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFolderName.trim()) {
      setAddFolderError('Folder name is required');
      return;
    }
    setCreatingFolder(true);
    setAddFolderError(null);
    try {
      await adminApi.documentsFolders.create({
        name: addFolderName.trim(),
        parentId: currentFolderId,
        allowedRoles: addFolderRoles,
      });
      toast.success('Folder created');
      setShowAddFolder(false);
      setAddFolderName('');
      fetchData();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create';
      setAddFolderError(msg);
      toast.error(msg);
    } finally {
      setCreatingFolder(false);
    }
  };

  const openDoc = (doc: Doc) => {
    setViewDoc(doc);
    setDocDetail(null);
    adminApi.documents.get(doc.id).then((d) => {
      setDocDetail({ versions: d.versions, latestVersion: d.latestVersion });
    });
  };

  const handleUploadVersion = async () => {
    if (!viewDoc || !uploadVersionFile) return;
    setUploadingVersion(true);
    try {
      await adminApi.documents.uploadVersion(viewDoc.id, uploadVersionFile);
      toast.success('New version uploaded');
      setUploadVersionFile(null);
      const d = await adminApi.documents.get(viewDoc.id);
      setDocDetail({ versions: d.versions, latestVersion: d.latestVersion });
      setViewDoc({ ...viewDoc, latestVersion: d.latestVersion, versionCount: d.versions.length });
      fetchData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploadingVersion(false);
    }
  };

  const fullUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    return `${API_BASE}${path}`;
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-accent-800">Documents</h1>
          <p className="mt-1 text-sm text-accent-700">
            Manage documents and folders. Upload files, control access by role, and retain version history.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowAddFolder(true)}
            className="rounded-lg border border-accent-200 px-4 py-2 text-sm font-medium text-accent-700 hover:bg-accent-50"
          >
            New folder
          </button>
          <button
            type="button"
            onClick={() => setShowAddDoc(true)}
            className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-700"
          >
            Upload document
          </button>
        </div>
      </div>

      {currentFolderId && (
        <div className="mb-4 flex items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => {
              setCurrentFolderId(null);
              setCurrentFolderName('');
            }}
            className="text-accent-600 hover:underline"
          >
            Documents
          </button>
          <span className="text-accent-400">/</span>
          <span className="font-medium text-accent-800">{currentFolderName || 'Folder'}</span>
        </div>
      )}

      <DataState loading={loading} error={error}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {currentFolderId && (
            <button
              type="button"
              onClick={() => {
                setCurrentFolderId(null);
                setCurrentFolderName('');
              }}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-accent-200 bg-accent-50/50 p-6 transition hover:border-accent-300 hover:bg-accent-100"
            >
              <span className="mb-2 text-4xl">⬆️</span>
              <span className="text-sm font-medium text-accent-700">Up</span>
            </button>
          )}
          {folders.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setCurrentFolderId(f.id);
                setCurrentFolderName(f.name);
              }}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-accent-200 bg-amber-50/80 p-6 transition hover:border-amber-300 hover:bg-amber-100"
            >
              <span className="mb-2 text-4xl">📁</span>
              <span className="text-center text-sm font-medium text-accent-800 break-words max-w-full truncate" title={f.name}>
                {f.name}
              </span>
              <span className="mt-1 text-xs text-accent-500">{f.allowedRoles.length} roles</span>
            </button>
          ))}
          {documents.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => openDoc(d)}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-accent-200 bg-white p-6 shadow-sm transition hover:border-accent-300 hover:shadow"
            >
              <span className="mb-2 text-4xl">{getFileIcon(d.latestVersion?.originalFilename || d.name)}</span>
              <span className="text-center text-sm font-medium text-accent-800 break-words max-w-full truncate" title={d.name}>
                {d.name}
              </span>
              <span className="mt-1 text-xs text-accent-500">
                v{d.latestVersion?.version ?? '-'} • {d.latestVersion?.uploadedAt ? new Date(d.latestVersion.uploadedAt).toLocaleDateString() : '-'}
              </span>
            </button>
          ))}
        </div>
        {!loading && !error && folders.length === 0 && documents.length === 0 && (
          <p className="py-12 text-center text-accent-600">
            No documents or folders. Create a folder and upload documents.
          </p>
        )}
      </DataState>

      {/* Add Document Modal */}
      {showAddDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => !creatingDoc && setShowAddDoc(false)}
        >
          <form
            className="w-full max-w-md rounded-xl border border-accent-200 bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateDoc}
          >
            <h2 className="mb-4 text-lg font-semibold text-accent-800">Upload Document</h2>
            {addDocError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{addDocError}</div>
            )}
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Document name</label>
                <input
                  type="text"
                  value={addDocName}
                  onChange={(e) => setAddDocName(e.target.value)}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                  placeholder="e.g. Privacy Policy"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Category</label>
                <select
                  value={addDocCategory}
                  onChange={(e) => setAddDocCategory(e.target.value)}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Roles that can access</label>
                <div className="flex flex-wrap gap-2">
                  {ROLE_OPTIONS.map((r) => (
                    <label key={r} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={addDocRoles.includes(r)}
                        onChange={(e) =>
                          setAddDocRoles((prev) =>
                            e.target.checked ? [...prev, r] : prev.filter((x) => x !== r)
                          )
                        }
                      />
                      <span className="text-sm">{r}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">File</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.html,.json,.xml,.png,.jpg,.jpeg,.gif,.webp,.svg,.rtf,.zip"
                  onChange={(e) => setAddDocFile(e.target.files?.[0] || null)}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-accent-500">PDF, Word, Excel, images, text, etc. Max 50MB</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !creatingDoc && setShowAddDoc(false)}
                className="rounded-lg border border-accent-200 px-4 py-2 text-sm font-medium text-accent-700 hover:bg-accent-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingDoc}
                className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-700 disabled:opacity-50"
              >
                {creatingDoc ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Folder Modal */}
      {showAddFolder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => !creatingFolder && setShowAddFolder(false)}
        >
          <form
            className="w-full max-w-md rounded-xl border border-accent-200 bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateFolder}
          >
            <h2 className="mb-4 text-lg font-semibold text-accent-800">New Folder</h2>
            {addFolderError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{addFolderError}</div>
            )}
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Folder name</label>
                <input
                  type="text"
                  value={addFolderName}
                  onChange={(e) => setAddFolderName(e.target.value)}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                  placeholder="e.g. Policies"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Roles that can access</label>
                <div className="flex flex-wrap gap-2">
                  {ROLE_OPTIONS.map((r) => (
                    <label key={r} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={addFolderRoles.includes(r)}
                        onChange={(e) =>
                          setAddFolderRoles((prev) =>
                            e.target.checked ? [...prev, r] : prev.filter((x) => x !== r)
                          )
                        }
                      />
                      <span className="text-sm">{r}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !creatingFolder && setShowAddFolder(false)}
                className="rounded-lg border border-accent-200 px-4 py-2 text-sm font-medium text-accent-700 hover:bg-accent-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingFolder}
                className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-700 disabled:opacity-50"
              >
                {creatingFolder ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Document Modal */}
      {viewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setViewDoc(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl border border-accent-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-accent-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-accent-800">{viewDoc.name}</h2>
                <p className="text-sm text-accent-600">
                  Version {docDetail?.latestVersion?.version ?? viewDoc.latestVersion?.version ?? '-'} • Updated{' '}
                  {docDetail?.latestVersion?.uploadedAt
                    ? new Date(docDetail.latestVersion.uploadedAt).toLocaleString()
                    : viewDoc.latestVersion?.uploadedAt
                      ? new Date(viewDoc.latestVersion.uploadedAt).toLocaleString()
                      : '-'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewDoc(null)}
                className="rounded-lg p-2 text-accent-600 hover:bg-accent-100"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {docDetail?.latestVersion?.url && canPreview(docDetail.latestVersion.url) ? (
                <div className="min-h-[400px]">
                  {docDetail.latestVersion.url.endsWith('.pdf') || docDetail.latestVersion.url.includes('.pdf') ? (
                    <iframe
                      src={fullUrl(docDetail.latestVersion.url)}
                      title={viewDoc.name}
                      className="h-[70vh] w-full rounded-lg border border-accent-200"
                    />
                  ) : /\.(png|jpg|jpeg|gif|webp|svg)(\?|$)/i.test(docDetail.latestVersion.url) ? (
                    <img
                      src={fullUrl(docDetail.latestVersion.url)}
                      alt={viewDoc.name}
                      className="max-h-[70vh] rounded-lg border border-accent-200 object-contain"
                    />
                  ) : (
                    <iframe
                      src={fullUrl(docDetail.latestVersion.url)}
                      title={viewDoc.name}
                      className="h-[70vh] w-full rounded-lg border border-accent-200"
                      sandbox="allow-same-origin"
                    />
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-accent-600">Preview not available for this file type.</p>
                  <a
                    href={docDetail?.latestVersion?.url ? fullUrl(docDetail.latestVersion.url) : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700"
                  >
                    Download / Open
                  </a>
                </div>
              )}
            </div>

            <div className="border-t border-accent-200 px-6 py-4">
              <div className="mb-4">
                <h3 className="mb-2 text-sm font-medium text-accent-700">Upload new version</h3>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.html,.json,.xml,.png,.jpg,.jpeg,.gif,.webp,.svg,.rtf,.zip"
                    onChange={(e) => setUploadVersionFile(e.target.files?.[0] || null)}
                    className="flex-1 rounded-lg border border-accent-200 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleUploadVersion}
                    disabled={!uploadVersionFile || uploadingVersion}
                    className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
                  >
                    {uploadingVersion ? 'Uploading...' : 'Upload version'}
                  </button>
                </div>
                <p className="mt-1 text-xs text-accent-500">Previous versions are retained in the database.</p>
              </div>
              {docDetail && docDetail.versions.length > 1 && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-accent-700">Version history</h3>
                  <ul className="space-y-1 text-sm text-accent-600">
                    {[...docDetail.versions].reverse().map((v) => (
                      <li key={v.version}>
                        v{v.version} • {new Date(v.uploadedAt).toLocaleString()} • {v.originalFilename}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
