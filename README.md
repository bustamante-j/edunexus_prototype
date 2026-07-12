# EduNexus Prototype

EduNexus is a Vercel-ready React prototype for Balili Elementary School. It demonstrates how one centralized learner record can feed attendance, academic recording, promotion decisions, analytics, and automated school forms without repeated encoding.

## Included Workflows

- Role-aware access for the School Head, Administrative Officer, and Class Adviser
- A fictional Philippine-context dataset with 897 learners across 30 sections
- Central learner repository with search, filters, registration, CSV import, and individual profiles
- AM/PM daily attendance and monthly summaries with 20% absence warnings
- Three-term class records with automatic WW, PT, EX, initial-grade, and term-grade computation
- Grade 1 descriptive reporting for SY 2026-2027
- Promotion readiness using academic and attendance indicators
- School-wide and class-level analytics
- Downloadable PDF outputs for SF2, SF4, SF9, and SF10
- Activity history and school configuration screens
- Browser-local data persistence and a full reset option

## Presentation Accounts

All accounts use the password `12345678`.

| Role | Email |
| --- | --- |
| School Head | `joshkane@edu.ph` |
| Administrative Officer | `diane@edu.ph` |
| Class Adviser | `joshua@edu.ph` |

The login page can fill any of these accounts automatically.

## Technology

- React 19 and TypeScript
- Vite
- React Router
- Zustand with browser persistence
- Recharts
- jsPDF and jsPDF-AutoTable
- React Hook Form and Zod
- Papa Parse
- Framer Motion
- Lucide icons
- Sonner notifications

## Local Development

```bash
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

## Verification

```bash
npm run lint
npm test
npm run build
```

## Vercel Deployment

Import this directory as a Vercel project or deploy it with the Vercel CLI.

- Framework preset: `Vite`
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: none required for the prototype

The included `vercel.json` rewrites application routes to `index.html`, allowing direct links such as `/learners` and `/forms` to work after deployment.

## Assessment Policy Implemented

The current class-record engine follows the SY 2026-2027 transition rules in [DepEd Order No. 15, s. 2026](https://www.deped.gov.ph/2026/06/04/june-4-2026-do-015-s-2026-revised-guidelines-on-classroom-assessment-grading-system-and-awards-and-recognition-for-the-k-to-12-basic-education-program/):

- Most Grade 4-6 learning areas: 20% Written/Oral Works, 50% Performance Tasks, 30% Examinations
- EPP and MAPEH: 20% Written/Oral Works, 60% Performance Tasks, 20% Examinations
- Examination component: 30% ST1, 30% ST2, 40% Term Examination
- Adjusted transmutation for SY 2026-2027, where an initial grade of 70 maps to a passing term grade of 75
- Three academic terms
- Grade 1 descriptive reporting during the transition period

Generated school forms are review-ready prototypes. School personnel must still validate all information against current DepEd, LIS, and school requirements before official use.

## Security Boundary

This version is intentionally a client-side prototype. Its login, role boundaries, and records are stored in the browser and are meant only for controlled demonstrations with fictional data.

Do not enter real learner information into this prototype. A production implementation should add server-side authentication, a secured database, row-level access policies, encryption, audit retention, backups, input validation, rate limiting, and formal Data Privacy Act controls.
