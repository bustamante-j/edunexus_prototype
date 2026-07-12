import { HIGHEST_POSSIBLE_SCORES } from "../lib/grade-engine";
import type {
  AppUser,
  AttendanceDay,
  AuditEntry,
  DescriptiveGradeSheet,
  GradeLevel,
  GradeSheet,
  Learner,
  SchoolProfile,
  ScoreSet,
  Section,
  Subject,
  Term,
} from "../types/domain";

export const SCHOOL_PROFILE: SchoolProfile = {
  name: "Balili Elementary School",
  schoolId: "135617",
  region: "Cordillera Administrative Region",
  division: "Schools Division of Benguet",
  district: "La Trinidad District",
  address: "Tebteb, Balili, La Trinidad, Benguet",
  email: "135617@deped.gov.ph",
  phone: "(074) 422-6570",
  schoolHead: "Joshkane V. Gabol",
  activeSchoolYear: "2026-2027",
  schoolYearStart: "2026-06-15",
  schoolYearEnd: "2027-03-31",
  officialEnrollment: 897,
  teachingPersonnel: 30,
  administrativePersonnel: 2,
};

export const SUBJECTS: Subject[] = [
  { id: "filipino", code: "FIL", name: "Filipino", category: "core" },
  { id: "english", code: "ENG", name: "English", category: "core" },
  { id: "mathematics", code: "MATH", name: "Mathematics", category: "core" },
  { id: "science", code: "SCI", name: "Science", category: "core" },
  {
    id: "araling-panlipunan",
    code: "AP",
    name: "Araling Panlipunan",
    category: "core",
  },
  {
    id: "gmrc",
    code: "GMRC",
    name: "Good Manners and Right Conduct",
    category: "core",
  },
  {
    id: "epp",
    code: "EPP",
    name: "Edukasyong Pantahanan at Pangkabuhayan",
    category: "performance",
  },
  { id: "mapeh", code: "MAPEH", name: "MAPEH", category: "performance" },
];

const adviserNames = [
  "Diane Kaye D. Ancheta",
  "Joshua B. Garcia",
  "Aileen M. Abad",
  "Carlo B. Agustin",
  "Maribel T. Alipio",
  "Noel S. Aquino",
  "Cristina M. Bastian",
  "Renato D. Bay-an",
  "Liza P. Cabato",
  "Edwin C. Cacayorin",
  "Grace T. Calsiyao",
  "Ramon P. Cariaga",
  "Nerissa D. Castro",
  "Josefina M. Cayat",
  "Arthur B. Dacanay",
  "Marjorie F. Dela Cruz",
  "Rogelio G. Dominguez",
  "Analyn C. Esteban",
  "Jerome P. Fianza",
  "Rosemarie T. Garcia",
  "Lourdes A. Gayo",
  "Michael D. Ignacio",
  "Elena M. Kitma",
  "Joel P. Labi",
  "Rowena C. Macli-ing",
  "Patrick B. Ngalob",
  "Jennifer T. Olsim",
  "Roberto M. Pacio",
  "Sheryl D. Palao",
  "Vincent C. Tacio",
];

const gradeSections: Array<{ gradeLevel: GradeLevel; names: string[] }> = [
  {
    gradeLevel: "Kindergarten",
    names: ["Sampaguita", "Rosal", "Gumamela", "Ilang-Ilang", "Waling-Waling", "Camia"],
  },
  { gradeLevel: "Grade 1", names: ["Narra", "Molave", "Acacia", "Yakal"] },
  { gradeLevel: "Grade 2", names: ["Narra", "Molave", "Acacia", "Yakal"] },
  { gradeLevel: "Grade 3", names: ["Narra", "Molave", "Acacia", "Yakal"] },
  { gradeLevel: "Grade 4", names: ["Narra", "Molave", "Acacia", "Yakal"] },
  { gradeLevel: "Grade 5", names: ["Narra", "Molave", "Acacia", "Yakal"] },
  { gradeLevel: "Grade 6", names: ["Narra", "Molave", "Acacia", "Yakal"] },
];

function slug(value: string) {
  return value.toLowerCase().replaceAll(" ", "-");
}

export const SECTIONS: Section[] = gradeSections.flatMap((group) =>
  group.names.map((name) => {
    const id = `${slug(group.gradeLevel)}-${slug(name)}`;
    const index = gradeSections
      .flatMap((item) => item.names.map((sectionName) => `${item.gradeLevel}-${sectionName}`))
      .indexOf(`${group.gradeLevel}-${name}`);
    return {
      id,
      gradeLevel: group.gradeLevel,
      name,
      adviserName:
        id === "grade-4-narra"
          ? "Joshua B. Garcia"
          : index === 1
            ? "Jerome P. Fianza"
            : adviserNames[index],
      room: group.gradeLevel === "Kindergarten" ? `K-${index + 1}` : `Room ${index + 1}`,
      schoolYear: SCHOOL_PROFILE.activeSchoolYear,
    };
  }),
);

export const USERS: AppUser[] = [
  {
    id: "user-school-head",
    email: "joshkane@edu.ph",
    password: "12345678",
    fullName: "Joshkane V. Gabol",
    role: "school_head",
    title: "School Head",
    initials: "JG",
    assignedSectionIds: [],
  },
  {
    id: "user-admin-officer",
    email: "diane@edu.ph",
    password: "12345678",
    fullName: "Diane M. Santos",
    role: "admin_officer",
    title: "Administrative Officer II",
    initials: "DS",
    assignedSectionIds: [],
  },
  {
    id: "user-teacher",
    email: "joshua@edu.ph",
    password: "12345678",
    fullName: "Joshua B. Garcia",
    role: "teacher",
    title: "Grade 4 Class Adviser",
    initials: "JG",
    assignedSectionIds: ["grade-4-narra"],
  },
];

const maleFirstNames = [
  "Juan Miguel", "Jose Antonio", "John Paul", "Mark Angelo", "Carlo Miguel", "Paolo Andres",
  "Luis Gabriel", "Rafael Jose", "Miguel Angelo", "Joshua Daniel", "Nathaniel John", "Jericho Luis",
  "Gabriel Paul", "Angelo Rafael", "Christian Jose", "Adrian Miguel", "Aldrin James", "Bryan Carlo",
  "Daniel Marco", "Elijah Jose", "Enzo Gabriel", "Ethan Luis", "Gian Paolo", "Harvey John",
  "Ian Rafael", "Jacob Miguel", "James Carlo", "Joaquin Luis", "Kenzo Paul", "Liam Andres",
  "Lucas Gabriel", "Marco Antonio", "Matthew Jose", "Nathan Carlo", "Noah Miguel", "Paolo Miguel",
  "Rafael Andres", "Samuel Luis", "Vincent Paul", "Aaron Joshua", "Andrei Gabriel", "Anton Miguel",
  "Caleb Jose", "Cedric Paolo", "David Angelo", "Diego Luis", "Jerome Carlo", "Nico Rafael",
];

const femaleFirstNames = [
  "Maria Angela", "Mary Grace", "Anne Patricia", "Angelica Mae", "Maria Isabel", "Anna Beatrice",
  "Camille Rose", "Carla Mae", "Catherine Joy", "Danica Mae", "Elena Marie", "Ella Grace",
  "Erika Joy", "Faith Anne", "Frances Mae", "Gabriela Rose", "Hannah Grace", "Isabella Mae",
  "Jasmine Anne", "Julia Marie", "Kathleen Joy", "Kiara Mae", "Leah Grace", "Liana Rose",
  "Louise Anne", "Mae Patricia", "Mara Isabel", "Maria Sophia", "Mikaela Joy", "Nicole Anne",
  "Patricia Mae", "Rachelle Joy", "Samantha Rose", "Sophia Grace", "Trisha Mae", "Ysabel Anne",
  "Abigail Rose", "Althea Mae", "Amara Joy", "Andrea Grace", "Angela Marie", "Bianca Rose",
  "Celine Mae", "Chloe Anne", "Daniela Grace", "Janine Marie", "Kristine Mae", "Lovely Anne",
];

const lastNames = [
  "Abad", "Agustin", "Alcantara", "Alipio", "Aquino", "Bagano", "Bagsic", "Bastian",
  "Bay-an", "Cabato", "Cacayorin", "Calsiyao", "Cariaga", "Carantes", "Castro", "Cayat",
  "Dacanay", "Dela Cruz", "Dominguez", "Esteban", "Fianza", "Flores", "Garcia", "Gayo",
  "Gonzales", "Ignacio", "Kitma", "Labi", "Lacwasan", "Macli-ing", "Mendoza", "Ngalob",
  "Olsim", "Pacio", "Palao", "Panes", "Paredes", "Pascual", "Quinto", "Ramos",
  "Reyes", "Rivera", "Salvador", "Sanchez", "Santos", "Soriano", "Tacio", "Tagle",
  "Tamayo", "Torres", "Valdez", "Velasco", "Villanueva", "Wakit", "Zamora", "Balan",
  "Bugnay", "Dizon", "Luna", "Navarro", "Palispis", "Piraso", "Pudayan", "Tacloy",
];

const barangays = [
  "Alapang", "Alno", "Ambiong", "Bahong", "Balili", "Beckel", "Betag", "Bineng",
  "Cruz", "Lubas", "Pico", "Poblacion", "Puguis", "Shilan", "Tawang", "Wangal",
];

function gradeNumber(gradeLevel: GradeLevel) {
  if (gradeLevel === "Kindergarten") return 0;
  return Number(gradeLevel.replace("Grade ", ""));
}

function phone(index: number) {
  return `09${String(170000000 + ((index * 7919) % 829999999)).padStart(9, "0").slice(0, 9)}`;
}

export function createSeedLearners(): Learner[] {
  return Array.from({ length: SCHOOL_PROFILE.officialEnrollment }, (_, index) => {
    const section = SECTIONS[index % SECTIONS.length];
    const sex = Math.floor(index / SECTIONS.length) % 2 === 0 ? "Male" : "Female";
    const firstNames = sex === "Male" ? maleFirstNames : femaleFirstNames;
    const firstName = firstNames[index % firstNames.length];
    const householdIndex = Math.floor(index / 2);
    const lastName = lastNames[householdIndex % lastNames.length];
    const householdCycle = Math.floor(householdIndex / lastNames.length);
    const middleName = lastNames[(householdIndex * 7 + householdCycle * 11 + 13) % lastNames.length];
    const guardianFirstNames = householdIndex % 2 === 0 ? femaleFirstNames : maleFirstNames;
    const guardianFirstName = guardianFirstNames[(householdIndex * 5) % guardianFirstNames.length];
    const grade = gradeNumber(section.gradeLevel);
    const age = (grade === 0 ? 5 : grade + 5) + (index % 11 === 0 ? 1 : 0);
    const birthYear = 2026 - age;
    const birthMonth = String((index % 12) + 1).padStart(2, "0");
    const birthDay = String((index % 27) + 1).padStart(2, "0");
    const barangay = barangays[householdIndex % barangays.length];
    const houseNumber = 1 + ((householdIndex * 11) % 180);
    const purok = 1 + (householdIndex % 7);
    const movement =
      index % 173 === 0
        ? "Transferred in"
        : index % 211 === 0
          ? "Late enrollee"
          : "Enrolled";
    const previousGrade = Math.max(0, grade - 1);

    return {
      id: `learner-${String(index + 1).padStart(4, "0")}`,
      lrn: `135617${260001 + index}`,
      firstName,
      middleName,
      lastName,
      sex,
      birthDate: `${birthYear}-${birthMonth}-${birthDay}`,
      address: `House ${houseNumber}, Purok ${purok}, Barangay ${barangay}, La Trinidad, Benguet`,
      guardianName: `${guardianFirstName} ${middleName} ${lastName}`,
      guardianContact: phone(householdIndex),
      gradeLevel: section.gradeLevel,
      sectionId: section.id,
      enrollmentStatus: movement,
      enrolledOn: movement === "Late enrollee" ? "2026-07-06" : "2026-06-15",
      promotionStatus: "Pending review",
      enrollmentHistory:
        grade === 0
          ? []
          : [
              {
                schoolYear: "2025-2026",
                gradeLevel: previousGrade === 0 ? "Kindergarten" : (`Grade ${previousGrade}` as GradeLevel),
                section: ["Narra", "Molave", "Acacia", "Yakal"][index % 4],
                school: SCHOOL_PROFILE.name,
                status: "Completed",
              },
            ],
    };
  });
}

export const SEED_LEARNERS = createSeedLearners();

function hash(input: string) {
  let value = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    value ^= input.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return Math.abs(value);
}

function scoreFor(
  learnerId: string,
  subjectId: string,
  term: Term,
  component: string,
  index: number,
  highest: number,
) {
  const learnerIndex = Number(learnerId.replace("learner-", ""));
  const baseline =
    learnerIndex % 37 === 0
      ? 0.58
      : learnerIndex % 19 === 0
        ? 0.68
        : learnerIndex % 11 === 0
          ? 0.74
          : 0.78 + (hash(`${learnerId}-${subjectId}`) % 18) / 100;
  const jitter = ((hash(`${learnerId}-${subjectId}-${term}-${component}-${index}`) % 11) - 5) / 100;
  return Math.round(Math.min(1, Math.max(0.35, baseline + jitter + (term - 1) * 0.01)) * highest);
}

export function buildSeedScores(
  learnerId: string,
  subjectId: string,
  term: Term,
): ScoreSet {
  return {
    ww: HIGHEST_POSSIBLE_SCORES.ww.map((highest, index) =>
      scoreFor(learnerId, subjectId, term, "ww", index, highest),
    ) as [number, number, number],
    pt: HIGHEST_POSSIBLE_SCORES.pt.map((highest, index) =>
      scoreFor(learnerId, subjectId, term, "pt", index, highest),
    ) as [number, number, number],
    exams: HIGHEST_POSSIBLE_SCORES.exams.map((highest, index) =>
      scoreFor(learnerId, subjectId, term, "exams", index, highest),
    ) as [number, number, number],
  };
}

export function buildGradeSheet(
  sectionId: string,
  subjectId: string,
  term: Term,
  learners: Learner[],
): GradeSheet {
  const sectionLearners = learners.filter((learner) => learner.sectionId === sectionId);
  return {
    id: `${sectionId}-${subjectId}-term-${term}`,
    sectionId,
    subjectId,
    term,
    rows: sectionLearners.map((learner) => ({
      learnerId: learner.id,
      scores: buildSeedScores(learner.id, subjectId, term),
    })),
    updatedAt: "2026-07-10T08:30:00.000Z",
    updatedBy: "Joshua B. Garcia",
  };
}

export function buildDescriptiveSheet(
  sectionId: string,
  subjectId: string,
  term: Term,
  learners: Learner[],
): DescriptiveGradeSheet {
  const marks = ["A", "B", "B", "C", "C", "C", "D"] as const;
  return {
    id: `${sectionId}-${subjectId}-term-${term}-descriptive`,
    sectionId,
    subjectId,
    term,
    marks: Object.fromEntries(
      learners
        .filter((learner) => learner.sectionId === sectionId)
        .map((learner, index) => [learner.id, marks[index % marks.length]]),
    ),
    updatedAt: "2026-07-10T08:30:00.000Z",
    updatedBy: "Joshua B. Garcia",
  };
}

const attendanceDates = [
  "2026-06-29",
  "2026-06-30",
  "2026-07-01",
  "2026-07-02",
  "2026-07-03",
  "2026-07-06",
  "2026-07-07",
  "2026-07-08",
  "2026-07-09",
  "2026-07-10",
];

export function createSeedAttendance(learners: Learner[]): AttendanceDay[] {
  return SECTIONS.flatMap((section, sectionIndex) => {
    const sectionLearners = learners.filter((learner) => learner.sectionId === section.id);
    return attendanceDates.map((date, dayIndex) => ({
      id: `${section.id}-${date}`,
      date,
      sectionId: section.id,
      recordedBy: section.adviserName,
      updatedAt: `${date}T08:15:00.000Z`,
      entries: Object.fromEntries(
        sectionLearners.map((learner, learnerIndex) => {
          const riskLearner = learnerIndex === 0 && dayIndex < 3;
          const code = (learnerIndex * 13 + dayIndex * 7 + sectionIndex) % 149;
          const am = riskLearner ? "A" : code === 0 ? "A" : code % 43 === 0 ? "L" : code % 97 === 0 ? "E" : "P";
          const pm = riskLearner ? "A" : code === 0 ? "A" : code % 61 === 0 ? "L" : code % 127 === 0 ? "E" : "P";
          return [
            learner.id,
            {
              am,
              pm,
              remarks: am === "E" || pm === "E" ? "Medical appointment" : "",
            },
          ];
        }),
      ),
    }));
  });
}

export const SEED_ATTENDANCE = createSeedAttendance(SEED_LEARNERS);

export const SEED_GRADE_SHEETS: GradeSheet[] = SUBJECTS.flatMap((subject) =>
  ([1, 2, 3] as Term[]).map((term) =>
    buildGradeSheet("grade-4-narra", subject.id, term, SEED_LEARNERS),
  ),
);

export const SEED_DESCRIPTIVE_SHEETS: DescriptiveGradeSheet[] = SUBJECTS.flatMap(
  (subject) =>
    ([1, 2, 3] as Term[]).map((term) =>
      buildDescriptiveSheet("grade-1-narra", subject.id, term, SEED_LEARNERS),
    ),
);

export const SEED_AUDIT_LOG: AuditEntry[] = [
  {
    id: "audit-001",
    timestamp: "2026-07-10T09:34:00.000Z",
    userName: "Joshua B. Garcia",
    action: "Updated class record",
    module: "Grades",
    detail: "Grade 4 Narra - Mathematics - Term 1",
  },
  {
    id: "audit-002",
    timestamp: "2026-07-10T08:16:00.000Z",
    userName: "Joshua B. Garcia",
    action: "Completed daily attendance",
    module: "Attendance",
    detail: "Grade 4 Narra - July 10, 2026",
  },
  {
    id: "audit-003",
    timestamp: "2026-07-09T15:20:00.000Z",
    userName: "Diane M. Santos",
    action: "Generated school form",
    module: "Reports",
    detail: "SF4 monthly consolidation - June 2026",
  },
  {
    id: "audit-004",
    timestamp: "2026-07-09T10:05:00.000Z",
    userName: "Joshkane V. Gabol",
    action: "Reviewed promotion readiness",
    module: "Promotion",
    detail: "Grades 4 to 6 cohort review",
  },
];
