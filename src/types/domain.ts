export type Role = "school_head" | "admin_officer" | "teacher";

export type GradeLevel =
  | "Kindergarten"
  | "Grade 1"
  | "Grade 2"
  | "Grade 3"
  | "Grade 4"
  | "Grade 5"
  | "Grade 6";

export type Sex = "Male" | "Female";
export type EnrollmentStatus =
  | "Enrolled"
  | "Late enrollee"
  | "Transferred in"
  | "Transferred out"
  | "Dropped";

export type PromotionStatus =
  | "Pending review"
  | "Promoted"
  | "For remediation"
  | "Retained";

export interface AppUser {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: Role;
  title: string;
  initials: string;
  assignedSectionIds: string[];
}

export interface SchoolProfile {
  name: string;
  schoolId: string;
  region: string;
  division: string;
  district: string;
  address: string;
  email: string;
  phone: string;
  schoolHead: string;
  activeSchoolYear: string;
  schoolYearStart: string;
  schoolYearEnd: string;
  officialEnrollment: number;
  teachingPersonnel: number;
  administrativePersonnel: number;
}

export interface Section {
  id: string;
  gradeLevel: GradeLevel;
  name: string;
  adviserName: string;
  room: string;
  schoolYear: string;
}

export interface EnrollmentHistoryItem {
  schoolYear: string;
  gradeLevel: GradeLevel;
  section: string;
  school: string;
  status: string;
}

export interface Learner {
  id: string;
  lrn: string;
  firstName: string;
  middleName: string;
  lastName: string;
  sex: Sex;
  birthDate: string;
  address: string;
  guardianName: string;
  guardianContact: string;
  gradeLevel: GradeLevel;
  sectionId: string;
  enrollmentStatus: EnrollmentStatus;
  enrolledOn: string;
  promotionStatus: PromotionStatus;
  enrollmentHistory: EnrollmentHistoryItem[];
}

export type AttendanceMark = "P" | "A" | "L" | "E";

export interface AttendanceEntry {
  am: AttendanceMark;
  pm: AttendanceMark;
  remarks: string;
}

export interface AttendanceDay {
  id: string;
  date: string;
  sectionId: string;
  entries: Record<string, AttendanceEntry>;
  recordedBy: string;
  updatedAt: string;
}

export type Term = 1 | 2 | 3;
export type SubjectCategory = "core" | "performance";

export interface Subject {
  id: string;
  code: string;
  name: string;
  category: SubjectCategory;
}

export interface ScoreSet {
  ww: [number, number, number];
  pt: [number, number, number];
  exams: [number, number, number];
}

export interface GradeRow {
  learnerId: string;
  scores: ScoreSet;
}

export interface GradeSheet {
  id: string;
  sectionId: string;
  subjectId: string;
  term: Term;
  rows: GradeRow[];
  updatedAt: string;
  updatedBy: string;
}

export type DescriptiveMark = "A" | "B" | "C" | "D" | "E";

export interface DescriptiveGradeSheet {
  id: string;
  sectionId: string;
  subjectId: string;
  term: Term;
  marks: Record<string, DescriptiveMark>;
  updatedAt: string;
  updatedBy: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  userName: string;
  action: string;
  module: string;
  detail: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  tone: "info" | "warning" | "danger";
  href: string;
}

