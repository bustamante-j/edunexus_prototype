# EduNexus Presentation Guide

## One-Sentence Introduction

EduNexus centralizes learner attendance and academic records so that teachers encode information once and the school can automatically prepare connected reports and school forms.

## Suggested Demonstration Flow

1. Sign in as the Class Adviser and open the Grade 4 Narra dashboard.
2. Open Learners, search for one learner, and show the connected profile, attendance, grades, and enrollment history.
3. Open Attendance, change an AM or PM status, save the sheet, and generate SF2.
4. Open Class Records, change one score, and show the automatic WW, PT, EX, initial-grade, transmutation, and warning result.
5. Generate the learner's SF9 and SF10 from the School Forms section.
6. Switch to the Administrative Officer and demonstrate SF4 consolidation.
7. Switch to the School Head, review Analytics and Promotion, then show the activity log and school settings.

## Main Automation Point

Learner identity, class assignment, attendance, and grades are entered once. EduNexus reuses those connected records when creating SF2, SF4, SF9, SF10, analytics, and promotion recommendations.

## Security Statement

The prototype demonstrates role separation and audit visibility using fictional browser-local records. A production version must move authentication and learner data to a secured backend with server-side authorization, database row-level policies, encrypted transport and storage, backups, and formal privacy controls.

## Current Limitations

- This is a client-side prototype and must not store real learner data.
- It does not submit directly to LIS or EBEIS.
- Generated forms must be checked by authorized school personnel before official use.
- Exact school-form templates should be validated against the latest forms issued to the school.

