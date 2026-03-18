import { NextRequest, NextResponse } from '@/lib/next-compat';

const HERE_API_KEY = process.env.HERE_API_KEY || process.env.NEXT_PUBLIC_HERE_API_KEY;
const HERE_SUGGEST_URL = 'https://autocomplete.geocoder.ls.hereapi.com/6.2/suggest.json';

/**
 * Public proxy for HERE Geocoder Autocomplete API.
 * Returns address/location suggestions as the user types.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  if (!q || q.trim().length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  if (!HERE_API_KEY) {
    console.warn('HERE_API_KEY not configured; geocode suggest disabled');
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const url = new URL(HERE_SUGGEST_URL);
    url.searchParams.set('query', q.trim());
    url.searchParams.set('apiKey', HERE_API_KEY);
    url.searchParams.set('maxresults', '8');

    const res = await fetch(url.toString());
    if (!res.ok) {
      const text = await res.text();
      console.error('HERE suggest error:', res.status, text);
      return NextResponse.json({ suggestions: [] });
    }

    const data = (await res.json()) as {
      suggestions?: { label?: string }[];
    };
    const raw = data.suggestions ?? [];
    const suggestions = raw.map((s) => s.label ?? '').filter(Boolean);

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error('HERE suggest fetch error:', err);
    return NextResponse.json({ suggestions: [] });
  }
}
