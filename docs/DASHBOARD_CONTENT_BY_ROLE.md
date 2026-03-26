# Dashboard Content by Role

What is shown on each role's homepage (dashboard).

---

## Parent Dashboard

| Section | Content |
|--------|---------|
| **Header** | Welcome message with parent name |
| **Pending actions** | Payment failed, pending enrollment mapping, renewals due, open disputes |
| **Smart notifications** | Class in 15 min, upcoming class (next 2h) |
| **To-do (accordion)** | Verify phone, verify email, add student, search teachers |
| **Quick links** | Students, Teachers, Classes, Performances, Payments, Profile |
| **Stats** | Active enrollments, payments completed, exams taken, avg score |
| **Insights** | AI/metrics: performance summary, suggestions (from cron) |
| **Chart** | Performance bar chart (if metrics available) |
| **Upcoming classes** | Next 5 classes with subject & time |

---

## Teacher Dashboard

| Section | Content |
|--------|---------|
| **Header** | Welcome message with teacher name |
| **Pending actions** | Pending payments, open disputes |
| **Smart notifications** | Class in 15 min, batch starting tomorrow |
| **To-do (accordion)** | Complete profile, create batch, add bank details |
| **Quick links** | Batches, Students, Classes, Payments, Profile |
| **Stats** | Batches, total students, classes conducted, upcoming classes, total earnings |
| **Insights** | Performance summary, suggestions (from cron) |
| **Chart** | Classes done vs upcoming (from metrics) |
| **Upcoming classes** | Next 5 classes |

---

## Student Dashboard

| Section | Content |
|--------|---------|
| **Header** | Fun welcome with student name, class level |
| **Pending actions** | (Reserved for future: exams due, assignments) |
| **Smart notifications** | Class in 15 min (highlighted), upcoming class |
| **To-do (accordion)** | View courses, join next class, take exam |
| **Quick links** | My Courses, Classes, Exams, Study |
| **Stats** | Courses, exams taken, avg score, classes attended |
| **Insights** | Performance summary, encouraging suggestions |
| **Chart** | Avg score bar (if available) |
| **Upcoming classes** | Next 5 classes with subject & time |
| **AI reminder** | Class monitoring rules (camera, mic, presence) |

---

## Notes

- **To-do accordion**: Can be minimized or expanded. Opens by default if any item is incomplete.
- **AI metrics**: Updated by cron job (`cron-dashboard-metrics`) daily at 2 AM. No AI call on page load.
- **Student mails**: All student-related notifications go to the parent's email only.
- **Full width**: Dashboards use full-width layout for a modern, spacious feel.
