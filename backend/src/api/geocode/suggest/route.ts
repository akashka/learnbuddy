import { NextRequest, NextResponse } from '@/lib/next-compat';

const HERE_API_KEY = process.env.HERE_API_KEY || process.env.NEXT_PUBLIC_HERE_API_KEY;
const HERE_AUTOSUGGEST_URL = 'https://autosuggest.search.hereapi.com/v1/autosuggest';
const PHOTON_URL = 'https://photon.komoot.io/api/'; // Free OSM-based fallback, no API key

/**
 * Public proxy for location autocomplete. Uses HERE when configured, else Photon (free OSM).
 * Returns address/location suggestions as the user types.
 */
export async function GET(request: NextRequest) {
  const q = new URL(request.url).searchParams.get('q');
  if (!q || q.trim().length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  if (HERE_API_KEY) {
    return hereSuggest(q.trim());
  }
  return photonSuggest(q.trim());
}

async function hereSuggest(q: string): Promise<NextResponse> {
  try {
    const url = new URL(HERE_AUTOSUGGEST_URL);
    url.searchParams.set('q', q);
    url.searchParams.set('apiKey', HERE_API_KEY!);
    url.searchParams.set('limit', '8');
    url.searchParams.set('at', '20.5937,78.9629'); // India center for location bias
    url.searchParams.set('show', 'details');
    url.searchParams.set('result_types', 'address,place');

    const res = await fetch(url.toString());
    const text = await res.text();

    if (!res.ok) {
      console.error('HERE suggest error:', res.status, text);
      return NextResponse.json({ suggestions: [] });
    }

    type HereResponse = { items?: Array<{ title?: string; address?: { label?: string } }> };
    let data: HereResponse;
    try {
      data = JSON.parse(text) as HereResponse;
    } catch {
      console.error('HERE suggest: response is not valid JSON:', text.slice(0, 100));
      return NextResponse.json({ suggestions: [] });
    }

    const raw = data.items ?? [];
    const suggestions = raw
      .map((s) => s.address?.label ?? s.title ?? '')
      .filter(Boolean);

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error('HERE suggest fetch error:', err);
    return NextResponse.json({ suggestions: [] });
  }
}

async function photonSuggest(q: string): Promise<NextResponse> {
  try {
    const url = new URL(PHOTON_URL);
    url.searchParams.set('q', q);
    url.searchParams.set('limit', '8');
    url.searchParams.set('lat', '20.5937');
    url.searchParams.set('lon', '78.9629'); // India center for location bias
    url.searchParams.set('lang', 'en');

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'LearnBuddy-Tuition-Platform/1.0' },
    });
    const text = await res.text();

    if (!res.ok) {
      console.error('Photon suggest error:', res.status, text);
      return NextResponse.json({ suggestions: [] });
    }

    type PhotonFeature = {
      properties?: {
        name?: string;
        street?: string;
        housenumber?: string;
        postcode?: string;
        city?: string;
        state?: string;
        country?: string;
      };
    };
    type PhotonResponse = { features?: PhotonFeature[] };

    let data: PhotonResponse;
    try {
      data = JSON.parse(text) as PhotonResponse;
    } catch {
      console.error('Photon suggest: response is not valid JSON:', text.slice(0, 100));
      return NextResponse.json({ suggestions: [] });
    }

    const raw = data.features ?? [];
    const suggestions = raw
      .map((f) => {
        const p = f.properties;
        if (!p) return '';
        const parts: string[] = [];
        if (p.name) parts.push(p.name);
        if (p.street) parts.push(p.housenumber ? `${p.housenumber} ${p.street}` : p.street);
        if (p.city && p.city !== p.name) parts.push(p.city);
        if (p.state) parts.push(p.state);
        if (p.country) parts.push(p.country);
        return parts.join(', ') || p.name || '';
      })
      .filter(Boolean);

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error('Photon suggest fetch error:', err);
    return NextResponse.json({ suggestions: [] });
  }
}
