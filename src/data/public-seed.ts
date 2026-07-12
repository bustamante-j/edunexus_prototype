export interface PublicAnnouncement {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  category: string;
}

export interface PublicEvent {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  location: string;
  category: string;
}

export interface PublicProgram {
  id: string;
  title: string;
  summary: string;
  image: string;
}

export const PUBLIC_ANNOUNCEMENTS: PublicAnnouncement[] = [
  {
    id: "announcement-nutrition-month",
    title: "Nutrition Month activities begin across all grade levels",
    summary:
      "Class advisers will lead age-appropriate activities on healthy food choices, hygiene, and daily habits throughout July.",
    publishedAt: "2026-07-10T08:00:00+08:00",
    category: "School program",
  },
  {
    id: "announcement-reading-check",
    title: "First school-wide reading progress check scheduled",
    summary:
      "Learners will complete short classroom reading activities to help teachers plan focused support for the first term.",
    publishedAt: "2026-07-08T10:15:00+08:00",
    category: "Academic",
  },
  {
    id: "announcement-health-records",
    title: "Parents asked to update learner health information",
    summary:
      "Families may submit updated emergency contacts, allergy information, and relevant health notes through their class adviser.",
    publishedAt: "2026-07-03T14:30:00+08:00",
    category: "Family reminder",
  },
  {
    id: "announcement-orientation",
    title: "Parent orientation and class schedules completed",
    summary:
      "The school thanks parents and guardians who joined the opening orientation and reviewed classroom routines for the new school year.",
    publishedAt: "2026-06-26T16:00:00+08:00",
    category: "Community",
  },
  {
    id: "announcement-opening",
    title: "Balili Elementary School welcomes learners for SY 2026-2027",
    summary:
      "Classes have officially opened with regular attendance monitoring, classroom orientation, and learner record validation underway.",
    publishedAt: "2026-06-15T07:30:00+08:00",
    category: "Official update",
  },
];

export const PUBLIC_EVENTS: PublicEvent[] = [
  {
    id: "event-reading-orientation",
    title: "Family Reading Orientation",
    description: "A short session on practical reading routines families can continue at home.",
    startsAt: "2026-07-17T13:30:00+08:00",
    endsAt: "2026-07-17T15:00:00+08:00",
    location: "School Library",
    category: "Family engagement",
  },
  {
    id: "event-nutrition-culmination",
    title: "Nutrition Month Culminating Activity",
    description: "Grade-level presentations, healthy baon exhibits, and wellness activities for learners.",
    startsAt: "2026-07-30T08:00:00+08:00",
    endsAt: "2026-07-30T11:30:00+08:00",
    location: "Covered Court",
    category: "School program",
  },
  {
    id: "event-parent-conference",
    title: "First Parent-Teacher Conference",
    description: "Class advisers will discuss attendance, adjustment, and early learning observations.",
    startsAt: "2026-08-07T13:00:00+08:00",
    endsAt: "2026-08-07T16:30:00+08:00",
    location: "Assigned Classrooms",
    category: "Family engagement",
  },
  {
    id: "event-buwan-wika",
    title: "Buwan ng Wika School Celebration",
    description: "Learner performances and classroom activities celebrating Filipino language and culture.",
    startsAt: "2026-08-28T08:00:00+08:00",
    endsAt: "2026-08-28T12:00:00+08:00",
    location: "School Grounds",
    category: "Culture",
  },
  {
    id: "event-term-assessment",
    title: "First Term Assessment Week",
    description: "Scheduled written works, performance checks, and term assessments across grade levels.",
    startsAt: "2026-09-14T07:30:00+08:00",
    endsAt: "2026-09-18T16:00:00+08:00",
    location: "Classrooms",
    category: "Academic",
  },
  {
    id: "event-progress-day",
    title: "Reading and Numeracy Progress Day",
    description: "Teachers review class progress and identify learners who may benefit from added support.",
    startsAt: "2026-09-25T08:00:00+08:00",
    endsAt: "2026-09-25T15:00:00+08:00",
    location: "Balili Elementary School",
    category: "Learner support",
  },
];

export const PUBLIC_PROGRAMS: PublicProgram[] = [
  {
    id: "program-reading",
    title: "Reading and Literacy",
    summary: "Daily reading routines, guided practice, and focused support for developing readers.",
    image: "/assets/program-reading.webp",
  },
  {
    id: "program-nutrition",
    title: "School Nutrition",
    summary: "Health, nutrition, and hygiene activities that help children arrive ready to learn.",
    image: "/assets/program-nutrition.webp",
  },
  {
    id: "program-wellness",
    title: "Sports and Wellness",
    summary: "Movement, play, and team activities that build healthy habits and confidence.",
    image: "/assets/program-sports.webp",
  },
  {
    id: "program-culture",
    title: "Arts and Culture",
    summary: "Creative work and school celebrations that value expression, language, and local identity.",
    image: "/assets/program-arts.webp",
  },
  {
    id: "program-support",
    title: "Learner Support",
    summary: "Teacher-led monitoring for learners who need help with attendance or academic progress.",
    image: "/assets/section-support.webp",
  },
  {
    id: "program-family",
    title: "Family Partnership",
    summary: "Clear coordination with parents and guardians around routines, progress, and school life.",
    image: "/assets/section-family.webp",
  },
];
