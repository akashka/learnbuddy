import { apiJson, apiUpload } from './api';

const BASE = '/api/admin';

export interface PlatformStats {
  counts: {
    teachers: number;
    parents: number;
    students: number;
    enrollments: number;
    enrollmentsActive: number;
    pendingEnrollments: number;
    pendingAiReviews?: number;
    openSecurityIncidents?: number;
    classesConducted: number;
    classesScheduled: number;
  };
  aiUsageReport?: {
    totalCalls: number;
    successCount: number;
    failedCount: number;
    successRate: number;
    byOperationType: { operationType: string; count: number }[];
    callsByDay: { date: string; count: number }[];
  };
  revenue: {
    total: number;
    thisMonth: number;
    teacherPaymentsTotal: number;
  };
  enrollmentsByDay: { date: string; count: number }[];
  revenueByDay: { date: string; total: number }[];
  usersByRole: { teachers: number; parents: number; students: number };
  newLast30Days: { teachers: number; parents: number; students: number };
}

export type GlobalSearchResult = {
  teachers: { _id: string; name?: string; email?: string; phone?: string; type: string }[];
  parents: { _id: string; name?: string; email?: string; phone?: string; type: string }[];
  students: { _id: string; name?: string; studentId?: string; email?: string; parentName?: string; type: string }[];
  staff: { _id: string; name?: string; email?: string; phone?: string; staffRole?: string; type: string }[];
};

export interface StaffProfile {
  staffRole: string;
  name: string | null;
  email: string | null;
  phone?: string;
  photo?: string;
  isActive?: boolean;
}

export const adminApi = {
  me: {
    get: () => apiJson<StaffProfile & { hasStaffRecord?: boolean }>(`${BASE}/me`),
    update: (data: { name?: string; phone?: string; photo?: string | null }) =>
      apiJson<StaffProfile>(`${BASE}/me`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    changePassword: (currentPassword: string, newPassword: string) =>
      apiJson<{ success: boolean; message: string }>(`${BASE}/me/change-password`, {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
  },
  stats: () => apiJson<PlatformStats>(`${BASE}/stats`),
  search: (q: string) => {
    const sp = new URLSearchParams();
    sp.set('q', q);
    return apiJson<GlobalSearchResult>(`${BASE}/search?${sp.toString()}`);
  },
  teachers: {
    list: (params?: { search?: string; status?: string; board?: string; class?: string; subject?: string; sort?: string; order?: string; page?: number; limit?: number }) => {
      const sp = new URLSearchParams();
      if (params?.search) sp.set('search', params.search);
      if (params?.status) sp.set('status', params.status);
      if (params?.board) sp.set('board', params.board);
      if (params?.class) sp.set('class', params.class);
      if (params?.subject) sp.set('subject', params.subject);
      if (params?.sort) sp.set('sort', params.sort);
      if (params?.order) sp.set('order', params.order);
      if (params?.page) sp.set('page', String(params.page));
      if (params?.limit) sp.set('limit', String(params.limit));
      const q = sp.toString();
      return apiJson<{ teachers: unknown[]; total: number; page: number; limit: number; totalPages: number }>(`${BASE}/teachers${q ? `?${q}` : ''}`);
    },
    get: (id: string) => apiJson(`${BASE}/teachers/${id}/detail`),
    update: (id: string, data: Record<string, unknown>) =>
      apiJson(`${BASE}/teachers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    approveBgv: (id: string) =>
      apiJson(`${BASE}/teachers/${id}/approve-bgv`, {
        method: 'POST',
      }),
  },
  parents: {
    list: (params?: { search?: string; sort?: string; order?: string; page?: number; limit?: number }) => {
      const sp = new URLSearchParams();
      if (params?.search) sp.set('search', params.search);
      if (params?.sort) sp.set('sort', params.sort);
      if (params?.order) sp.set('order', params.order);
      if (params?.page) sp.set('page', String(params.page));
      if (params?.limit) sp.set('limit', String(params.limit));
      const q = sp.toString();
      return apiJson<{ parents: unknown[]; total: number; page: number; limit: number; totalPages: number }>(`${BASE}/parents${q ? `?${q}` : ''}`);
    },
    get: (id: string) => apiJson(`${BASE}/parents/${id}`),
    update: (id: string, data: { name?: string; phone?: string; location?: string }) =>
      apiJson(`${BASE}/parents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
  students: {
    list: (params?: { search?: string; parentId?: string; board?: string; class?: string; sort?: string; order?: string; page?: number; limit?: number }) => {
      const sp = new URLSearchParams();
      if (params?.search) sp.set('search', params.search);
      if (params?.parentId) sp.set('parentId', params.parentId);
      if (params?.board) sp.set('board', params.board);
      if (params?.class) sp.set('class', params.class);
      if (params?.sort) sp.set('sort', params.sort);
      if (params?.order) sp.set('order', params.order);
      if (params?.page) sp.set('page', String(params.page));
      if (params?.limit) sp.set('limit', String(params.limit));
      const q = sp.toString();
      return apiJson<{ students: unknown[]; total: number; page: number; limit: number; totalPages: number }>(`${BASE}/students${q ? `?${q}` : ''}`);
    },
    get: (id: string) => apiJson(`${BASE}/students/${id}`),
    update: (id: string, data: { name?: string; classLevel?: string; schoolName?: string; board?: string; photoUrl?: string; idProofUrl?: string }) =>
      apiJson(`${BASE}/students/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
  enrollments: {
    list: () => apiJson<{ pendings: unknown[]; completed: unknown[] }>(`${BASE}/enrollments`),
    getPending: (id: string) => apiJson(`${BASE}/enrollments/pending/${id}`),
    getCompleted: (id: string) => apiJson(`${BASE}/enrollments/completed/${id}`),
  },
  discountCodes: {
    list: () => apiJson<{ codes: unknown[] }>(`${BASE}/discount-codes`),
    get: (id: string) => apiJson<{ code: unknown }>(`${BASE}/discount-codes/${id}`),
    create: (data: {
      code: string;
      type: 'percent' | 'fixed';
      value: number;
      minAmount?: number;
      maxUses?: number;
      validFrom?: string;
      validUntil?: string;
      isActive?: boolean;
      applicableBoards?: string[];
      applicableClasses?: string[];
      description?: string;
    }) =>
      apiJson(`${BASE}/discount-codes`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<{
      code: string;
      type: 'percent' | 'fixed';
      value: number;
      minAmount?: number;
      maxDiscountAmount?: number;
      maxUses?: number;
      validFrom?: string;
      validUntil?: string;
      isActive?: boolean;
      applicableBoards?: string[];
      applicableClasses?: string[];
      description?: string;
    }>) =>
      apiJson(`${BASE}/discount-codes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getRedemptions: (id: string) =>
      apiJson<{ code: unknown; redemptions: unknown[] }>(`${BASE}/discount-codes/${id}/redemptions`),
  },
  enrollmentsManage: (body: Record<string, unknown>) =>
    apiJson(`${BASE}/enrollments/manage`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  masters: () => apiJson<{ boards: unknown[]; classes: unknown[]; subjects: unknown[]; mappings: unknown[] }>(`${BASE}/masters`),
  topics: {
    list: (params?: { board?: string; class?: string; subject?: string; includeInactive?: boolean }) => {
      const sp = new URLSearchParams();
      if (params?.board) sp.set('board', params.board);
      if (params?.class) sp.set('class', params.class);
      if (params?.subject) sp.set('subject', params.subject);
      if (params?.includeInactive) sp.set('includeInactive', 'true');
      const q = sp.toString();
      return apiJson<{ topics: { _id: string; board: string; classLevel: string; subject: string; topic: string; displayOrder: number; isActive: boolean }[] }>(`${BASE}/topics${q ? `?${q}` : ''}`);
    },
    create: (data: { board: string; classLevel: string; subject: string; topic: string; displayOrder?: number }) =>
      apiJson(`${BASE}/topics`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { topic?: string; displayOrder?: number; isActive?: boolean }) =>
      apiJson(`${BASE}/topics/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => apiJson(`${BASE}/topics/${id}`, { method: 'DELETE' }),
  },
  aiData: {
    list: (params?: { type?: string; board?: string; class?: string; subject?: string; topic?: string; page?: number; limit?: number }) => {
      const sp = new URLSearchParams();
      if (params?.type) sp.set('type', params.type);
      if (params?.board) sp.set('board', params.board);
      if (params?.class) sp.set('class', params.class);
      if (params?.subject) sp.set('subject', params.subject);
      if (params?.topic) sp.set('topic', params.topic);
      if (params?.page) sp.set('page', String(params.page));
      if (params?.limit) sp.set('limit', String(params.limit));
      const q = sp.toString();
      return apiJson<{ items: unknown[]; total: number; page: number; limit: number; totalPages: number }>(`${BASE}/ai-data${q ? `?${q}` : ''}`);
    },
    get: (id: string) => apiJson(`${BASE}/ai-data/${id}`),
    submitFeedback: (id: string, whatWasWrong: string) =>
      apiJson(`${BASE}/ai-data/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ whatWasWrong }),
      }),
  },
  drafts: () => apiJson<{ teacherDrafts: unknown[]; parentDrafts: unknown[] }>(`${BASE}/drafts`),
  draftsUpdate: (body: { type: 'teacher' | 'parent'; id: string; data: Record<string, unknown> }) =>
    apiJson(`${BASE}/drafts/update`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  classes: {
    list: (params?: { status?: string; from?: string; to?: string; limit?: number }) => {
      const sp = new URLSearchParams();
      if (params?.status) sp.set('status', params.status);
      if (params?.from) sp.set('from', params.from);
      if (params?.to) sp.set('to', params.to);
      if (params?.limit) sp.set('limit', String(params.limit));
      const q = sp.toString();
      return apiJson<{ sessions: unknown[]; enrollments: unknown[] }>(`${BASE}/classes${q ? `?${q}` : ''}`);
    },
    get: (id: string) => apiJson(`${BASE}/classes/${id}`),
  },
  jobPositions: {
    list: () => apiJson<{ positions: { id: string; title: string; team: string; type: string; location: string; description: string; jdUrl: string | null; status: string; createdAt: string; updatedAt: string }[] }>(`${BASE}/job-positions`),
    get: (id: string) => apiJson(`${BASE}/job-positions/${id}`),
    create: (data: { title: string; team: string; type: string; location: string; description?: string }) =>
      apiJson(`${BASE}/job-positions`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { title?: string; team?: string; type?: string; location?: string; description?: string; status?: string }) =>
      apiJson(`${BASE}/job-positions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiJson(`${BASE}/job-positions/${id}`, { method: 'DELETE' }),
    uploadJd: async (id: string, file: File) => {
      const formData = new FormData();
      formData.append('jd', file);
      const res = await apiUpload(`${BASE}/job-positions/${id}/jd`, formData);
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || 'Upload failed');
      return data as { jdUrl: string; message: string };
    },
  },
  jobApplications: {
    list: (params?: { positionId?: string; status?: string }) => {
      const sp = new URLSearchParams();
      if (params?.positionId) sp.set('positionId', params.positionId);
      if (params?.status) sp.set('status', params.status);
      const q = sp.toString();
      return apiJson<{ applications: { id: string; positionId: string; positionTitle?: string; name: string; email: string; phone: string; resumeUrl: string; coverLetter: string; status: string; remarks: string; createdAt: string; updatedAt: string }[] }>(`${BASE}/job-applications${q ? `?${q}` : ''}`);
    },
    get: (id: string) => apiJson(`${BASE}/job-applications/${id}`),
    update: (id: string, data: { status?: string; remarks?: string }) =>
      apiJson(`${BASE}/job-applications/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  contactSubmissions: {
    list: (params?: { status?: string; type?: string; page?: number; limit?: number }) => {
      const sp = new URLSearchParams();
      if (params?.status) sp.set('status', params.status);
      if (params?.type) sp.set('type', params.type);
      if (params?.page) sp.set('page', String(params.page));
      if (params?.limit) sp.set('limit', String(params.limit));
      const q = sp.toString();
      return apiJson<{
        submissions: { id: string; name: string; email: string; phone?: string; type: string; subject: string; message: string; status: string; adminNotes?: string; createdAt: string; updatedAt: string }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`${BASE}/contact-submissions${q ? `?${q}` : ''}`);
    },
    get: (id: string) => apiJson(`${BASE}/contact-submissions/${id}`),
    update: (id: string, data: { status?: string; adminNotes?: string }) =>
      apiJson(`${BASE}/contact-submissions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  websiteSettings: {
    get: () =>
      apiJson<{
        playStoreUrl: string;
        appStoreUrl: string;
        facebookUrl: string;
        twitterUrl: string;
        linkedinUrl: string;
        instagramUrl: string;
        youtubeUrl: string;
        contactPhone: string;
        contactHours: string;
        contactDays: string;
      }>(`${BASE}/website-settings`),
    update: (data: {
      playStoreUrl?: string;
      appStoreUrl?: string;
      facebookUrl?: string;
      twitterUrl?: string;
      linkedinUrl?: string;
      instagramUrl?: string;
      youtubeUrl?: string;
      contactPhone?: string;
      contactHours?: string;
      contactDays?: string;
    }) =>
      apiJson(`${BASE}/website-settings`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
  cmsPages: {
    list: () => apiJson<{ pages: { slug: string; title: string; content: string; updatedAt: string }[] }>(`${BASE}/cms-pages`),
    get: (slug: string) => apiJson<{ slug: string; title: string; content: string; updatedAt: string }>(`${BASE}/cms-pages/${slug}`),
    update: (slug: string, data: { title: string; content: string }) =>
      apiJson(`${BASE}/cms-pages/${slug}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
  auditLogs: {
    list: (params?: { action?: string; resourceType?: string; actorId?: string; success?: string; sort?: string; order?: string; page?: number; limit?: number; from?: string; to?: string }) => {
      const sp = new URLSearchParams();
      if (params?.action) sp.set('action', params.action);
      if (params?.resourceType) sp.set('resourceType', params.resourceType);
      if (params?.actorId) sp.set('actorId', params.actorId);
      if (params?.success) sp.set('success', params.success);
      if (params?.sort) sp.set('sort', params.sort);
      if (params?.order) sp.set('order', params.order);
      if (params?.page) sp.set('page', String(params.page));
      if (params?.limit) sp.set('limit', String(params.limit));
      if (params?.from) sp.set('from', params.from);
      if (params?.to) sp.set('to', params.to);
      const q = sp.toString();
      return apiJson<{ logs: unknown[]; total: number; page: number; limit: number; totalPages: number }>(`${BASE}/audit-logs${q ? `?${q}` : ''}`);
    },
    get: (id: string) => apiJson(`${BASE}/audit-logs/${id}`),
  },
  aiUsageLogs: {
    list: (params?: { operationType?: string; success?: string; source?: string; sort?: string; order?: string; page?: number; limit?: number }) => {
      const sp = new URLSearchParams();
      if (params?.operationType) sp.set('operationType', params.operationType);
      if (params?.success) sp.set('success', params.success);
      if (params?.source) sp.set('source', params.source);
      if (params?.sort) sp.set('sort', params.sort);
      if (params?.order) sp.set('order', params.order);
      if (params?.page) sp.set('page', String(params.page));
      if (params?.limit) sp.set('limit', String(params.limit));
      const q = sp.toString();
      return apiJson<{ logs: unknown[]; total: number; page: number; limit: number; totalPages: number }>(`${BASE}/ai-usage-logs${q ? `?${q}` : ''}`);
    },
    get: (id: string) => apiJson(`${BASE}/ai-usage-logs/${id}`),
  },
  aiModels: () =>
    apiJson<{
      providers: Array<{
        id: string;
        name: string;
        models: string[];
        capabilities: string[];
        knownLimit: string;
        configured: boolean;
        status: 'healthy' | 'degraded' | 'unknown' | 'not_configured';
        lastCheck: string | null;
        latencyMs: number | null;
        successCount: number;
        failureCount: number;
        lastError: string | null;
      }>;
      fallbackOrder: string[];
      usage: { today: number; last7Days: number; successRateToday: number; successRateWeek: number };
    }>(`${BASE}/ai-models`),
  aiReviewRequests: {
    list: (params?: { status?: string; entityType?: string; sort?: string; order?: string; page?: number; limit?: number }) => {
      const sp = new URLSearchParams();
      if (params?.status) sp.set('status', params.status);
      if (params?.entityType) sp.set('entityType', params.entityType);
      if (params?.sort) sp.set('sort', params.sort);
      if (params?.order) sp.set('order', params.order);
      if (params?.page) sp.set('page', String(params.page));
      if (params?.limit) sp.set('limit', String(params.limit));
      const q = sp.toString();
      return apiJson<{ requests: unknown[]; total: number; page: number; limit: number; totalPages: number }>(`${BASE}/ai-review-requests${q ? `?${q}` : ''}`);
    },
    get: (id: string) => apiJson(`${BASE}/ai-review-requests/${id}`),
    resolve: (id: string, data: { status: 'resolved_correct' | 'resolved_incorrect'; adminReply?: string; correctedScore?: number; correctedContent?: Record<string, unknown> }) =>
      apiJson(`${BASE}/ai-review-requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
  staff: {
    list: (params?: { search?: string; staffRole?: string; isActive?: string; sort?: string; order?: string; page?: number; limit?: number }) => {
      const sp = new URLSearchParams();
      if (params?.search) sp.set('search', params.search);
      if (params?.staffRole) sp.set('staffRole', params.staffRole);
      if (params?.isActive !== undefined && params.isActive !== '') sp.set('isActive', params.isActive);
      if (params?.sort) sp.set('sort', params.sort);
      if (params?.order) sp.set('order', params.order);
      if (params?.page) sp.set('page', String(params.page));
      if (params?.limit) sp.set('limit', String(params.limit));
      const q = sp.toString();
      return apiJson<{ staff: unknown[]; total: number; page: number; limit: number; totalPages: number }>(`${BASE}/staff${q ? `?${q}` : ''}`);
    },
    get: (id: string) => apiJson(`${BASE}/staff/${id}`),
    create: (data: { name: string; email: string; phone?: string; photo?: string; staffRole: string; position?: string; department?: string; password?: string }) =>
      apiJson(`${BASE}/staff`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: { name?: string; email?: string; phone?: string; photo?: string | null; staffRole?: string; position?: string | null; department?: string | null; isActive?: boolean }) =>
      apiJson(`${BASE}/staff/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
  teacherPayments: {
    list: (params?: { teacherId?: string; year?: string; month?: string; status?: string; page?: number; limit?: number }) => {
      const sp = new URLSearchParams();
      if (params?.teacherId) sp.set('teacherId', params.teacherId);
      if (params?.year) sp.set('year', params.year);
      if (params?.month) sp.set('month', params.month);
      if (params?.status) sp.set('status', params.status);
      if (params?.page) sp.set('page', String(params.page));
      if (params?.limit) sp.set('limit', String(params.limit));
      const q = sp.toString();
      return apiJson<{ payments: unknown[]; total: number; page: number; limit: number; totalPages: number }>(`${BASE}/teacher-payments${q ? `?${q}` : ''}`);
    },
    get: (id: string) => apiJson(`${BASE}/teacher-payments/${id}`),
    reminders: () =>
      apiJson<{ reminders: { teacherId: string; teacherName: string; year: number; month: number }[] }>(`${BASE}/teacher-payments/reminders`),
    calculate: (params: { teacherId: string; year: number; month: number }) => {
      const sp = new URLSearchParams();
      sp.set('teacherId', params.teacherId);
      sp.set('year', String(params.year));
      sp.set('month', String(params.month));
      return apiJson(`${BASE}/teacher-payments/calculate?${sp.toString()}`);
    },
    create: (data: {
      teacherId: string;
      amount: number;
      periodStart: string;
      periodEnd: string;
      grossAmount?: number;
      commissionAmount?: number;
      commissionPercent?: number;
      tdsAmount?: number;
      tdsPercent?: number;
      breakdown?: { studentId: string; studentName: string; batchId: string; subject: string; classesCount: number; feePerMonth: number; amount: number }[];
      referenceId?: string;
    }) =>
      apiJson(`${BASE}/teacher-payments`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  disputes: {
    list: (params?: { status?: string; raisedBy?: string; page?: number; limit?: number }) => {
      const sp = new URLSearchParams();
      if (params?.status) sp.set('status', params.status);
      if (params?.raisedBy) sp.set('raisedBy', params.raisedBy);
      if (params?.page) sp.set('page', String(params.page));
      if (params?.limit) sp.set('limit', String(params.limit));
      const q = sp.toString();
      return apiJson<{ disputes: unknown[]; total: number; page: number; limit: number; totalPages: number }>(`${BASE}/disputes${q ? `?${q}` : ''}`);
    },
    get: (id: string) => apiJson(`${BASE}/disputes/${id}`),
    update: (id: string, data: { status?: string; adminNotes?: string }) =>
      apiJson(`${BASE}/disputes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
  documents: {
    list: (params?: { folderId?: string }) => {
      const sp = new URLSearchParams();
      if (params?.folderId) sp.set('folderId', params.folderId);
      const q = sp.toString();
      return apiJson<{
        folders: { id: string; name: string; parentId: string | null; allowedRoles: string[]; createdAt: string; updatedAt: string }[];
        documents: {
          id: string;
          name: string;
          folderId: string | null;
          category: string;
          allowedRoles: string[];
          versionCount: number;
          latestVersion: { version: number; uploadedAt: string; url: string; originalFilename: string } | null;
          createdAt: string;
          updatedAt: string;
        }[];
      }>(`${BASE}/documents${q ? `?${q}` : ''}`);
    },
    get: (id: string) =>
      apiJson<{
        id: string;
        name: string;
        folderId: string | null;
        category: string;
        allowedRoles: string[];
        versions: { version: number; uploadedAt: string; url: string; originalFilename: string }[];
        latestVersion: { version: number; uploadedAt: string; url: string; originalFilename: string } | null;
      }>(`${BASE}/documents/${id}`),
    create: (formData: FormData) =>
      apiUpload(`${BASE}/documents`, formData).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to create');
        return data;
      }),
    update: (id: string, data: { name?: string; category?: string; folderId?: string | null; allowedRoles?: string[] }) =>
      apiJson(`${BASE}/documents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) => apiJson(`${BASE}/documents/${id}`, { method: 'DELETE' }),
    uploadVersion: async (id: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiUpload(`${BASE}/documents/${id}/version`, formData);
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || 'Upload failed');
      return data;
    },
  },
  documentsFolders: {
    create: (data: { name: string; parentId?: string | null; allowedRoles?: string[] }) =>
      apiJson(`${BASE}/documents/folders`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    get: (id: string) =>
      apiJson<{ id: string; name: string; parentId: string | null; allowedRoles: string[] }>(
        `${BASE}/documents/folders/${id}`
      ),
  },
  reports: {
    overview: () => apiJson<{
      metrics: {
        teachers: number;
        parents: number;
        students: number;
        enrollments: number;
        activeEnrollments: number;
        totalRevenue: number;
        revenueLast30Days: number;
        revenueGrowthPercent: number;
        newTeachersLast30: number;
        newParentsLast30: number;
        newStudentsLast30: number;
        newEnrollmentsLast30: number;
        classCompletionRate: number;
        avgTeacherRating: number | null;
        totalReviews: number;
      };
      enrollmentsByDay: { date: string; count: number }[];
    }>(`${BASE}/reports/overview`),
    cohorts: (params?: { months?: number }) => {
      const sp = new URLSearchParams();
      if (params?.months) sp.set('months', String(params.months));
      return apiJson<{
        cohortDetails: { cohortMonth: string; enrolled: number; stillActive: number; completed: number; cancelled: number; retentionRate: number; churnRate: number; totalRevenue: number }[];
        retentionByMonth: { month: number; retained: number; cohortSize: number }[];
        summary: { totalCohorts: number; avgRetention: number; avgChurn: number };
      }>(`${BASE}/reports/cohorts${sp.toString() ? `?${sp}` : ''}`);
    },
    teacherPerformance: (params?: { limit?: number; sort?: string; order?: string }) => {
      const sp = new URLSearchParams();
      if (params?.limit) sp.set('limit', String(params.limit));
      if (params?.sort) sp.set('sort', params.sort);
      if (params?.order) sp.set('order', params.order);
      return apiJson<{
        teachers: { teacherId: string; teacherName: string; avgRating: number | null; reviewCount: number; completionRate: number | null; scheduledClasses: number; completedClasses: number; revenue: number; activeEnrollments: number }[];
        summary: { totalTeachers: number; avgRating: number | null; totalRevenue: number; avgCompletionRate: number | null };
      }>(`${BASE}/reports/teacher-performance${sp.toString() ? `?${sp}` : ''}`);
    },
    revenueBreakdown: (params?: { months?: number }) => {
      const sp = new URLSearchParams();
      if (params?.months) sp.set('months', String(params.months));
      return apiJson<{
        byBoard: { name: string; revenue: number; count: number }[];
        byClass: { name: string; revenue: number; count: number }[];
        bySubject: { name: string; revenue: number; count: number }[];
        byBoardClass: { board: string; classLevel: string; revenue: number; count: number }[];
        byBoardSubject: { board: string; subject: string; revenue: number; count: number }[];
        revenueByMonth: { month: string; revenue: number; count: number }[];
        totalRevenue: number;
        periodMonths: number;
      }>(`${BASE}/reports/revenue-breakdown${sp.toString() ? `?${sp}` : ''}`);
    },
    marketing: (params?: { days?: number }) => {
      const sp = new URLSearchParams();
      if (params?.days) sp.set('days', String(params.days));
      return apiJson<{
        periodDays: number;
        funnel: { newTeachers: number; newParents: number; newStudents: number; newEnrollments: number; conversionRate: number };
        discountUsage: { code: string; redemptions: number; totalDiscount: number }[];
        funnelByDay: { date: string; teachers: number; parents: number; enrollments: number }[];
      }>(`${BASE}/reports/marketing${sp.toString() ? `?${sp}` : ''}`);
    },
    operations: (params?: { days?: number }) => {
      const sp = new URLSearchParams();
      if (params?.days) sp.set('days', String(params.days));
      return apiJson<{
        periodDays: number;
        metrics: { scheduledClasses: number; completedClasses: number; cancelledClasses: number; inProgressNow: number; completionRate: number; cancellationRate: number; pendingEnrollments: number; activeEnrollments: number };
        sessionsByDay: { date: string; scheduled: number; completed: number }[];
        bySubject: { name: string; count: number }[];
      }>(`${BASE}/reports/operations${sp.toString() ? `?${sp}` : ''}`);
    },
    systemStatus: () =>
      apiJson<{
        timestamp: string;
        overall: 'healthy' | 'degraded' | 'unknown';
        services: Record<string, { status: 'up' | 'down' | 'unknown'; latencyMs?: number; message?: string }>;
      }>(`${BASE}/reports/system-status`),
    technology: (params?: { days?: number }) => {
      const sp = new URLSearchParams();
      if (params?.days) sp.set('days', String(params.days));
      return apiJson<{
        periodDays: number;
        aiUsage: { totalCalls: number; successCount: number; failedCount: number; successRate: number; byOperation: { operation: string; count: number; success: number }[]; byDay: { date: string; count: number; success: number }[] };
        aiReviews: { pending: number; totalInPeriod: number };
        security: { openIncidents: number; totalInPeriod: number; bySeverity: { severity: string; count: number }[] };
      }>(`${BASE}/reports/technology${sp.toString() ? `?${sp}` : ''}`);
    },
  },
  notificationTemplates: {
    list: (params?: { channel?: 'sms' | 'email' | 'in_app'; includeInactive?: boolean }) => {
      const sp = new URLSearchParams();
      if (params?.channel) sp.set('channel', params.channel);
      if (params?.includeInactive) sp.set('includeInactive', 'true');
      const q = sp.toString();
      return apiJson<{
        templates: {
          _id: string;
          channel: string;
          code: string;
          name: string;
          description?: string;
          isActive: boolean;
          body?: string;
          approvedWordings?: string[];
          subject?: string;
          bodyHtml?: string;
          headerHtml?: string;
          footerHtml?: string;
          logoUrl?: string;
          title?: string;
          message?: string;
          ctaLabel?: string;
          ctaUrl?: string;
          variableHints?: string[];
          createdAt: string;
          updatedAt: string;
        }[];
      }>(`${BASE}/notification-templates${q ? `?${q}` : ''}`);
    },
    get: (id: string) =>
      apiJson<{
        _id: string;
        channel: string;
        code: string;
        name: string;
        description?: string;
        isActive: boolean;
        body?: string;
        approvedWordings?: string[];
        subject?: string;
        bodyHtml?: string;
        headerHtml?: string;
        footerHtml?: string;
        logoUrl?: string;
        title?: string;
        message?: string;
        ctaLabel?: string;
        ctaUrl?: string;
        variableHints?: string[];
        createdAt: string;
        updatedAt: string;
      }>(`${BASE}/notification-templates/${id}`),
    create: (data: {
      channel: 'sms' | 'email' | 'in_app';
      code: string;
      name: string;
      description?: string;
      isActive?: boolean;
      body?: string;
      approvedWordings?: string[];
      subject?: string;
      bodyHtml?: string;
      headerHtml?: string;
      footerHtml?: string;
      logoUrl?: string;
      title?: string;
      message?: string;
      ctaLabel?: string;
      ctaUrl?: string;
      variableHints?: string[];
    }) =>
      apiJson(`${BASE}/notification-templates`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<{
      name: string;
      description: string;
      isActive: boolean;
      body: string;
      approvedWordings: string[];
      subject: string;
      bodyHtml: string;
      headerHtml: string;
      footerHtml: string;
      logoUrl: string;
      title: string;
      message: string;
      ctaLabel: string;
      ctaUrl: string;
      variableHints: string[];
    }>) =>
      apiJson(`${BASE}/notification-templates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiJson(`${BASE}/notification-templates/${id}`, { method: 'DELETE' }),
  },
  securityIncidents: {
    list: (params?: { status?: string; severity?: string; childrenAffected?: string; sort?: string; order?: string; page?: number; limit?: number }) => {
      const sp = new URLSearchParams();
      if (params?.status) sp.set('status', params.status);
      if (params?.severity) sp.set('severity', params.severity);
      if (params?.childrenAffected) sp.set('childrenAffected', params.childrenAffected);
      if (params?.sort) sp.set('sort', params.sort);
      if (params?.order) sp.set('order', params.order);
      if (params?.page) sp.set('page', String(params.page));
      if (params?.limit) sp.set('limit', String(params.limit));
      const q = sp.toString();
      return apiJson<{ incidents: unknown[]; total: number; page: number; limit: number; totalPages: number }>(`${BASE}/security-incidents${q ? `?${q}` : ''}`);
    },
    get: (id: string) => apiJson(`${BASE}/security-incidents/${id}`),
    create: (data: {
      title: string;
      description: string;
      type: string;
      severity: string;
      childrenDataAffected?: boolean;
      detectedAt?: string;
      affectedDataTypes?: string[];
      affectedUserCount?: number;
      actionsTaken?: string[];
    }) =>
      apiJson(`${BASE}/security-incidents`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: { status?: string; boardNotifiedAt?: string; usersNotifiedAt?: string; actionsTaken?: string[]; affectedUserCount?: number }) =>
      apiJson(`${BASE}/security-incidents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
};
