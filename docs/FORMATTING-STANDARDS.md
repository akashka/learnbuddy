# Formatting Standards

GuruChakra uses consistent formatting across the app, web, admin, emails, and backend.

## Date & Time

| Format | Example | Use |
|--------|---------|-----|
| **Date** | `20 Mar 2025` | Standalone dates (batch start, consent date, etc.) |
| **Time** | `02:30 PM` | Time only (12-hour format) |
| **Time with seconds** | `02:30:45 PM` | When precision matters (e.g. exam timestamps) |
| **DateTime** | `20 Mar 2025, 02:30 PM` | Full timestamp |
| **Relative** | `Just now`, `5m ago`, `2h ago`, `3d ago` | Recent items (notifications, activity) |

### Implementation

- **Frontend / Admin**: Import from `@shared/formatters`
- **App (mobile)**: Import from `../lib/formatters` (mirrors shared)
- **Backend**: Import from `@/lib/formatters` (for emails, CSV exports)

```ts
import { formatDate, formatTime, formatDateTime, formatTimeAgo } from '@shared/formatters';

formatDate('2025-03-20');        // "20 Mar 2025"
formatTime('2025-03-20T14:30');  // "02:30 PM"
formatDateTime('2025-03-20T14:30'); // "20 Mar 2025, 02:30 PM"
formatTimeAgo(isoString);        // "Just now" | "5m ago" | "20 Mar 2025"
```

## Currency

- **Currency**: INR (₹)
- **Locale**: `en-IN` (Indian number grouping: lakhs, crores)
- **Fraction digits**: 0 by default (whole rupees)

```ts
import { formatCurrency } from '@shared/formatters';

formatCurrency(2500);   // "₹2,500"
formatCurrency(99.99, 2); // "₹99.99" (when decimals needed)
```

## Numbers

- **Locale**: `en-IN`
- Use for counts, ratings, percentages

```ts
import { formatNumber, formatPercent } from '@shared/formatters';

formatNumber(1234567);  // "12,34,567"
formatPercent(15.5);    // "15.5%"
```

## Phone, File Size, Duration

```ts
import { formatPhone, formatBytes, formatDuration, formatDurationMs } from '@shared/formatters';

formatPhone('9876543210');     // "+91 98765 43210"
formatBytes(2621440);         // "2.5 MB"
formatDuration(90);           // "1m 30s" (seconds)
formatDurationMs(1500);       // "1.5s" (milliseconds)
```

## Other Recommendations

| Area | Recommendation |
|------|----------------|
| **Timezone** | Store and transmit in UTC (ISO 8601). Format for display in user's locale (IST for India). |

## Files

- `shared/formatters.ts` – Source of truth for frontend, admin
- `backend/src/lib/formatters.ts` – Backend (emails, CSV, API)
- `app/src/lib/formatters.ts` – Mobile app (mirrors shared)
