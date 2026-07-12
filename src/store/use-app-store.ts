import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  buildDescriptiveSheet,
  buildGradeSheet,
  SCHOOL_PROFILE,
  SECTIONS,
  SEED_ATTENDANCE,
  SEED_AUDIT_LOG,
  SEED_DESCRIPTIVE_SHEETS,
  SEED_GRADE_SHEETS,
  SEED_LEARNERS,
  SUBJECTS,
  USERS,
} from "../data/seed";
import type {
  AppUser,
  AttendanceDay,
  AttendanceMark,
  AuditEntry,
  DescriptiveGradeSheet,
  DescriptiveMark,
  GradeLevel,
  GradeSheet,
  Learner,
  PromotionStatus,
  SchoolProfile,
  ScoreSet,
  Section,
  Subject,
  Term,
} from "../types/domain";

type ScoreComponent = keyof ScoreSet;

interface NewLearnerInput {
  lrn: string;
  firstName: string;
  middleName: string;
  lastName: string;
  sex: Learner["sex"];
  birthDate: string;
  address: string;
  guardianName: string;
  guardianContact: string;
  sectionId: string;
}

interface AppState {
  currentUserId: string | null;
  users: AppUser[];
  school: SchoolProfile;
  sections: Section[];
  subjects: Subject[];
  learners: Learner[];
  attendanceDays: AttendanceDay[];
  gradeSheets: GradeSheet[];
  descriptiveSheets: DescriptiveGradeSheet[];
  auditLog: AuditEntry[];
  login: (email: string, password: string) => boolean;
  logout: () => void;
  switchUser: (userId: string) => void;
  addLearner: (input: NewLearnerInput) => Learner;
  updateLearner: (learnerId: string, updates: Partial<Learner>) => void;
  ensureAttendanceDay: (date: string, sectionId: string) => void;
  setAttendanceMark: (
    date: string,
    sectionId: string,
    learnerId: string,
    session: "am" | "pm",
    mark: AttendanceMark,
  ) => void;
  setAttendanceRemarks: (
    date: string,
    sectionId: string,
    learnerId: string,
    remarks: string,
  ) => void;
  markAllPresent: (date: string, sectionId: string) => void;
  ensureGradeSheet: (sectionId: string, subjectId: string, term: Term) => void;
  ensureDescriptiveSheet: (sectionId: string, subjectId: string, term: Term) => void;
  updateGradeScore: (
    sheetId: string,
    learnerId: string,
    component: ScoreComponent,
    index: number,
    score: number,
  ) => void;
  updateDescriptiveMark: (
    sheetId: string,
    learnerId: string,
    mark: DescriptiveMark,
  ) => void;
  promoteLearners: (
    learnerIds: string[],
    targetGrade: GradeLevel,
    targetSectionId: string,
    decision: PromotionStatus,
  ) => void;
  updateSchool: (updates: Partial<SchoolProfile>) => void;
  appendAudit: (entry: Omit<AuditEntry, "id" | "timestamp">) => void;
  resetPrototype: () => void;
}

function freshState() {
  return {
    currentUserId: null,
    users: USERS,
    school: SCHOOL_PROFILE,
    sections: SECTIONS,
    subjects: SUBJECTS,
    learners: SEED_LEARNERS,
    attendanceDays: SEED_ATTENDANCE,
    gradeSheets: SEED_GRADE_SHEETS,
    descriptiveSheets: SEED_DESCRIPTIVE_SHEETS,
    auditLog: SEED_AUDIT_LOG,
  };
}

function audit(
  userName: string,
  action: string,
  module: string,
  detail: string,
): AuditEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    userName,
    action,
    module,
    detail,
  };
}

function activeUser(state: AppState) {
  return state.users.find((user) => user.id === state.currentUserId);
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...freshState(),
      login: (email, password) => {
        const user = get().users.find(
          (candidate) =>
            candidate.email.toLowerCase() === email.trim().toLowerCase() &&
            candidate.password === password,
        );
        if (!user) return false;
        set((state) => ({
          currentUserId: user.id,
          auditLog: [
            audit(user.fullName, "Signed in", "Access", `Session opened as ${user.title}`),
            ...state.auditLog,
          ],
        }));
        return true;
      },
      logout: () => {
        const user = activeUser(get());
        set((state) => ({
          currentUserId: null,
          auditLog: user
            ? [audit(user.fullName, "Signed out", "Access", "Session closed"), ...state.auditLog]
            : state.auditLog,
        }));
      },
      switchUser: (userId) => {
        const user = get().users.find((candidate) => candidate.id === userId);
        if (!user) return;
        set((state) => ({
          currentUserId: userId,
          auditLog: [
            audit(user.fullName, "Switched presentation role", "Access", user.title),
            ...state.auditLog,
          ],
        }));
      },
      addLearner: (input) => {
        const state = get();
        const section = state.sections.find((item) => item.id === input.sectionId);
        const user = activeUser(state);
        const learner: Learner = {
          id: crypto.randomUUID(),
          ...input,
          gradeLevel: section?.gradeLevel ?? "Grade 1",
          enrollmentStatus: "Enrolled",
          enrolledOn: new Date().toISOString().slice(0, 10),
          promotionStatus: "Pending review",
          enrollmentHistory: [],
        };
        set((current) => ({
          learners: [learner, ...current.learners],
          auditLog: [
            audit(
              user?.fullName ?? "System user",
              "Created learner record",
              "Learners",
              `${learner.firstName} ${learner.lastName} - ${learner.lrn}`,
            ),
            ...current.auditLog,
          ],
        }));
        return learner;
      },
      updateLearner: (learnerId, updates) => {
        const state = get();
        const user = activeUser(state);
        set((current) => ({
          learners: current.learners.map((learner) =>
            learner.id === learnerId ? { ...learner, ...updates } : learner,
          ),
          auditLog: [
            audit(user?.fullName ?? "System user", "Updated learner record", "Learners", learnerId),
            ...current.auditLog,
          ],
        }));
      },
      ensureAttendanceDay: (date, sectionId) => {
        const state = get();
        if (state.attendanceDays.some((day) => day.date === date && day.sectionId === sectionId)) return;
        const user = activeUser(state);
        const entries = Object.fromEntries(
          state.learners
            .filter((learner) => learner.sectionId === sectionId)
            .map((learner) => [learner.id, { am: "P" as const, pm: "P" as const, remarks: "" }]),
        );
        set((current) => ({
          attendanceDays: [
            ...current.attendanceDays,
            {
              id: `${sectionId}-${date}`,
              date,
              sectionId,
              entries,
              recordedBy: user?.fullName ?? "School personnel",
              updatedAt: new Date().toISOString(),
            },
          ],
        }));
      },
      setAttendanceMark: (date, sectionId, learnerId, session, mark) => {
        get().ensureAttendanceDay(date, sectionId);
        const user = activeUser(get());
        set((state) => ({
          attendanceDays: state.attendanceDays.map((day) =>
            day.date === date && day.sectionId === sectionId
              ? {
                  ...day,
                  updatedAt: new Date().toISOString(),
                  recordedBy: user?.fullName ?? day.recordedBy,
                  entries: {
                    ...day.entries,
                    [learnerId]: {
                      ...(day.entries[learnerId] ?? { am: "P", pm: "P", remarks: "" }),
                      [session]: mark,
                    },
                  },
                }
              : day,
          ),
        }));
      },
      setAttendanceRemarks: (date, sectionId, learnerId, remarks) => {
        get().ensureAttendanceDay(date, sectionId);
        set((state) => ({
          attendanceDays: state.attendanceDays.map((day) =>
            day.date === date && day.sectionId === sectionId
              ? {
                  ...day,
                  updatedAt: new Date().toISOString(),
                  entries: {
                    ...day.entries,
                    [learnerId]: {
                      ...(day.entries[learnerId] ?? { am: "P", pm: "P" }),
                      remarks,
                    },
                  },
                }
              : day,
          ),
        }));
      },
      markAllPresent: (date, sectionId) => {
        get().ensureAttendanceDay(date, sectionId);
        const user = activeUser(get());
        set((state) => ({
          attendanceDays: state.attendanceDays.map((day) =>
            day.date === date && day.sectionId === sectionId
              ? {
                  ...day,
                  entries: Object.fromEntries(
                    Object.keys(day.entries).map((learnerId) => [
                      learnerId,
                      { ...day.entries[learnerId], am: "P", pm: "P" },
                    ]),
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : day,
          ),
          auditLog: [
            audit(
              user?.fullName ?? "System user",
              "Marked class present",
              "Attendance",
              `${sectionId} - ${date}`,
            ),
            ...state.auditLog,
          ],
        }));
      },
      ensureGradeSheet: (sectionId, subjectId, term) => {
        const state = get();
        const id = `${sectionId}-${subjectId}-term-${term}`;
        if (state.gradeSheets.some((sheet) => sheet.id === id)) return;
        set((current) => ({
          gradeSheets: [buildGradeSheet(sectionId, subjectId, term, current.learners), ...current.gradeSheets],
        }));
      },
      ensureDescriptiveSheet: (sectionId, subjectId, term) => {
        const state = get();
        const id = `${sectionId}-${subjectId}-term-${term}-descriptive`;
        if (state.descriptiveSheets.some((sheet) => sheet.id === id)) return;
        set((current) => ({
          descriptiveSheets: [
            buildDescriptiveSheet(sectionId, subjectId, term, current.learners),
            ...current.descriptiveSheets,
          ],
        }));
      },
      updateGradeScore: (sheetId, learnerId, component, index, score) => {
        const user = activeUser(get());
        set((state) => ({
          gradeSheets: state.gradeSheets.map((sheet) =>
            sheet.id === sheetId
              ? {
                  ...sheet,
                  updatedAt: new Date().toISOString(),
                  updatedBy: user?.fullName ?? sheet.updatedBy,
                  rows: sheet.rows.map((row) => {
                    if (row.learnerId !== learnerId) return row;
                    const values = [...row.scores[component]] as [number, number, number];
                    values[index] = score;
                    return { ...row, scores: { ...row.scores, [component]: values } };
                  }),
                }
              : sheet,
          ),
        }));
      },
      updateDescriptiveMark: (sheetId, learnerId, mark) => {
        const user = activeUser(get());
        set((state) => ({
          descriptiveSheets: state.descriptiveSheets.map((sheet) =>
            sheet.id === sheetId
              ? {
                  ...sheet,
                  marks: { ...sheet.marks, [learnerId]: mark },
                  updatedAt: new Date().toISOString(),
                  updatedBy: user?.fullName ?? sheet.updatedBy,
                }
              : sheet,
          ),
        }));
      },
      promoteLearners: (learnerIds, targetGrade, targetSectionId, decision) => {
        const state = get();
        const user = activeUser(state);
        const targetSection = state.sections.find((section) => section.id === targetSectionId);
        set((current) => ({
          learners: current.learners.map((learner) =>
            learnerIds.includes(learner.id)
              ? {
                  ...learner,
                  promotionStatus: decision,
                  enrollmentHistory: [
                    ...learner.enrollmentHistory,
                    {
                      schoolYear: current.school.activeSchoolYear,
                      gradeLevel: learner.gradeLevel,
                      section: current.sections.find((section) => section.id === learner.sectionId)?.name ?? "Unassigned",
                      school: current.school.name,
                      status: decision,
                    },
                  ],
                  ...(decision === "Promoted"
                    ? { gradeLevel: targetGrade, sectionId: targetSection?.id ?? learner.sectionId }
                    : {}),
                }
              : learner,
          ),
          auditLog: [
            audit(
              user?.fullName ?? "System user",
              "Completed promotion decision",
              "Promotion",
              `${learnerIds.length} learner records - ${decision}`,
            ),
            ...current.auditLog,
          ],
        }));
      },
      updateSchool: (updates) => {
        const user = activeUser(get());
        set((state) => ({
          school: { ...state.school, ...updates },
          auditLog: [
            audit(user?.fullName ?? "System user", "Updated school profile", "Setup", "School information"),
            ...state.auditLog,
          ],
        }));
      },
      appendAudit: (entry) => {
        set((state) => ({
          auditLog: [
            { ...entry, id: crypto.randomUUID(), timestamp: new Date().toISOString() },
            ...state.auditLog,
          ],
        }));
      },
      resetPrototype: () => set(freshState()),
    }),
    {
      name: "edunexus-prototype-v2",
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<AppState>),
        users: currentState.users,
      }),
    },
  ),
);
