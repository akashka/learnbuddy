const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005';

export { API_BASE };

export async function apiJson<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(res.ok ? 'Invalid response' : (text || `Request failed (${res.status})`));
  }
  if (!res.ok) {
    const msg = (data as { error?: string })?.error || text || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

export interface LandingStats {
  value: string;
  label: string;
  raw?: number;
}

export interface LandingReview {
  name: string;
  role: string;
  text: string;
  rating: number;
}

export interface LandingFeature {
  icon: string;
  title: string;
  description: string;
}

export interface CompanyValue {
  name: string;
  description: string;
}

export interface LandingCompany {
  vision: string;
  mission: string;
  descriptionShort: string;
  descriptionLong?: string;
  values: CompanyValue[];
  differentiators: string[];
  contact: { email: string; hours: string; responseTime: string };
}

export interface LandingHowItWorksItem {
  step: number;
  title: string;
  desc: string;
  icon: string;
}

export interface LandingBenefit {
  icon: string;
  title: string;
  desc: string;
}

export interface LandingAiFeature {
  title: string;
  desc: string;
}

export interface LandingRoleCard {
  to: string;
  title: string;
  image: string;
  desc: string;
}

export interface LandingData {
  brand?: { name: string; tagline: string };
  company?: LandingCompany;
  stats: LandingStats[];
  reviews: LandingReview[];
  features: LandingFeature[];
  howItWorks?: LandingHowItWorksItem[];
  benefits?: LandingBenefit[];
  aiFeatures?: LandingAiFeature[];
  roleCards?: LandingRoleCard[];
}

export async function fetchLandingData(): Promise<LandingData> {
  return apiJson<LandingData>('/api/website/landing');
}

export interface TeamMember {
  name: string;
  photo?: string;
  position: string;
  department: string;
}

export interface TeamData {
  team: TeamMember[];
}

export async function fetchTeam(): Promise<TeamData> {
  return apiJson<TeamData>('/api/website/team');
}

export interface WebsiteSettingsData {
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
}

export async function fetchWebsiteSettings(): Promise<WebsiteSettingsData> {
  return apiJson<WebsiteSettingsData>('/api/website/settings');
}

export interface JobPosition {
  id: string;
  title: string;
  team: string;
  type: string;
  location: string;
  description: string;
  jdUrl: string | null;
}

export interface JobPositionsData {
  positions: JobPosition[];
}

export async function fetchJobPositions(): Promise<JobPositionsData> {
  return apiJson<JobPositionsData>('/api/website/job-positions');
}

export interface BoardClassSubjectsData {
  boards?: string[];
  classes?: string[];
  subjects?: string[];
  mappings?: { board: string; classLevel: string; subjects: string[] }[];
}

export async function fetchBoardClassSubjects(): Promise<BoardClassSubjectsData> {
  return apiJson<BoardClassSubjectsData>('/api/board-class-subjects');
}

export interface FeaturedTeacher {
  _id: string;
  name: string;
  photoUrl?: string;
  qualification?: string;
  bio?: string;
  board?: string[];
  classes?: string[];
  subjects?: string[];
  averageRating: number | null;
  reviewCount: number;
  feeStartsFrom?: number;
  experienceMonths?: number;
}

export async function fetchFeaturedTeachers(limit = 6): Promise<FeaturedTeacher[]> {
  const data = await apiJson<FeaturedTeacher[]>(
    '/api/teachers/marketplace?sort=ratings'
  );
  return Array.isArray(data) ? data.slice(0, limit) : [];
}

export async function submitJobApplication(formData: FormData): Promise<{ message: string; id: string }> {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005';
  const res = await fetch(`${base}/api/website/job-applications`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to submit');
  return data as { message: string; id: string };
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  type: 'concern' | 'suggestion' | 'feedback' | 'other';
  subject: string;
  message: string;
}

export interface PageContentResponse {
  pageType: string;
  sections: Record<string, unknown>;
}

export async function fetchPageContent(page: string): Promise<PageContentResponse> {
  return apiJson<PageContentResponse>(`/api/website/page-content?page=${encodeURIComponent(page)}`);
}

export async function submitContactForm(data: ContactFormData): Promise<{ message: string; id: string }> {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005';
  const res = await fetch(`${base}/api/website/contact-submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error((result as { error?: string }).error || 'Failed to submit');
  return result as { message: string; id: string };
}
