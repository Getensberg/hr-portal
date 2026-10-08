import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  RequestType,
  RequestStatus,
  ContentType,
} from "@/generated/prisma/client";
import type { SurveyFrequency, QuestionType } from "@/generated/prisma/client";

export interface RequestItem {
  id: string;
  type: RequestType;
  status: RequestStatus;
  payload: Record<string, any> | null;
  files?: ContentFile[] | null;
  note: string | null;
  requestedAt: string;
  completedAt: string | null;
  user?: { fullName: string; email: string; department: string | null };
}

export interface ContentFile {
  url: string;
  name: string;
}

export interface ContentItem {
  id: string;
  title: string;
  content: string;
  type: ContentType;
  category: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  files?: ContentFile[] | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyQuestionItem {
  id: string;
  text: string;
  type: QuestionType;
}

export interface SurveyItem {
  id: string;
  title: string;
  isAnonymous: boolean;
  isSuggestionBox: boolean;
  questions: SurveyQuestionItem[];
  completed?: boolean;
  completionsCount?: number;
}

export interface SurveyResultQuestion {
  id: string;
  text: string;
  type: QuestionType;
  average?: number;
  counts?: Record<string, number>;
  texts?: string[];
}

export interface UserOption {
  id: string;
  fullName: string;
  email: string;
  role: string;
  department?: string | null;
  position?: string | null;
  phone?: string | null;
  managerId?: string | null;
}

export interface OrgPersonItem {
  id: string;
  fullName: string;
  position: string | null;
  department: string | null;
  phone: string | null;
  email: string | null;
  managerId: string | null;
  linkedUserId: string | null;
}

export interface MyOrgPerson extends OrgPersonItem {
  manager: { fullName: string; position: string | null; phone: string | null; email: string | null } | null;
}

export interface OnboardingTaskItem {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  done?: boolean;
  completedAt?: string | null;
}

export interface OnboardingPlanItem {
  id: string;
  newcomer: { id: string; fullName: string; email: string };
  mentor: { id: string; fullName: string; email: string } | null;
  startDate: string;
  endDate: string | null;
  tasks: OnboardingTaskItem[];
}

export interface MyOnboarding {
  plan: {
    id: string;
    mentor: { fullName: string; email: string } | null;
    startDate: string;
    endDate: string | null;
  } | null;
  tasks: OnboardingTaskItem[];
}

export interface SurveyResults {
  survey: { id: string; title: string; isAnonymous: boolean };
  completionsCount: number;
  questions: SurveyResultQuestion[];
}

export interface JobPostingItem {
  id: string;
  title: string;
  department: string | null;
  description: string;
  isActive: boolean;
  createdAt: string;
  referralsCount?: number;
}

export interface ReferralItem {
  id: string;
  candidateName: string;
  candidateContact: string;
  comment: string | null;
  createdAt: string;
  jobPosting?: { title: string };
  referrer?: { fullName: string; email: string };
}

export interface OrgUser {
  fullName: string;
  position: string | null;
  department: string | null;
  email: string;
}

export interface ProfileData {
  fullName: string;
  email: string;
  department: string | null;
  position: string | null;
  role: string;
}

export interface OrgDocumentItem {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
}

export interface DepartmentItem {
  id: string;
  name: string;
  color: string;
}

export interface VacationEntryItem {
  id: string;
  type: "VACATION" | "DAY_OFF";
  startDate: string;
  endDate: string;
  status: "PLANNED" | "CONFIRMED";
  comment: string | null;
}

export interface AdminVacationItem extends VacationEntryItem {
  user: { id: string; fullName: string; department: string | null; email: string };
}

export interface VacationInput {
  type: string;
  startDate: string;
  endDate: string;
  comment?: string;
}

export interface UserOption {
  id: string;
  fullName: string;
  email: string;
  role: string;
  department?: string | null;
  position?: string | null;
}

export interface HolidayItem {
  id: string;
  date: string;
  name: string;
}

export interface BlockedPeriodItem {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface CourseSummary {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: "DRAFT" | "PUBLISHED";
  accessMode: "OPEN" | "RESTRICTED";
  lessonsCount: number;
  testsCount: number;
  accessCount: number;
  createdAt: string;
}

export interface CourseTestSummary {
  id: string;
  title: string;
  questionsCount: number;
  attemptsCount: number;
}

export interface LessonItem {
  id: string;
  title: string;
  content: string;
  videoUrl: string | null;
  files: ContentFile[] | null;
  order: number;
}

export interface TestOptionItem {
  id: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

export interface TestQuestionItem {
  id: string;
  text: string;
  kind: "CHOICE" | "OPEN";
  order: number;
  options: TestOptionItem[];
}

export interface CourseDetail {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: "DRAFT" | "PUBLISHED";
  accessMode: "OPEN" | "RESTRICTED";
  lessons: LessonItem[];
  tests: CourseTestSummary[];
  access: { id: string; user: { id: string; fullName: string; department: string | null } }[];
}

export interface TestListItem {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: "DRAFT" | "PUBLISHED";
  accessMode: "OPEN" | "RESTRICTED";
  passingScore: number;
  maxAttempts: number;
  questionsCount: number;
  attemptsCount: number;
  accessCount: number;
}

export interface TestDetail {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  courseId: string | null;
  course: { id: string; title: string } | null;
  status: "DRAFT" | "PUBLISHED";
  accessMode: "OPEN" | "RESTRICTED";
  passingScore: number;
  maxAttempts: number;
  attemptsCount: number;
  questions: TestQuestionItem[];
  access: { id: string; user: { id: string; fullName: string; department: string | null } }[];
}

export type LearningStatus = "NOT_STARTED" | "IN_REVIEW" | "PASSED" | "FAILED";

export interface LearningCourseCard {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  lessonsTotal: number;
  lessonsDone: number;
  testsTotal: number;
  testsPassed: number;
  state: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
}

export interface LearningTestCard {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  questionsCount: number;
  maxAttempts: number;
  attemptsUsed: number;
  state: LearningStatus;
}

export interface LearningAttempt {
  id: string;
  testId: string;
  testTitle: string;
  courseId: string | null;
  courseTitle: string | null;
  status: "IN_REVIEW" | "GRADED";
  passed: boolean | null;
  submittedAt: string;
}

export interface LearningOverview {
  courses: LearningCourseCard[];
  tests: LearningTestCard[];
  attempts: LearningAttempt[];
}

export interface LearningLesson {
  id: string;
  title: string;
  content: string;
  videoUrl: string | null;
  files: ContentFile[] | null;
  done: boolean;
}

export interface LearningCourseTest {
  id: string;
  title: string;
  description: string | null;
  questionsCount: number;
  maxAttempts: number;
  attemptsUsed: number;
  state: LearningStatus;
}

export interface LearningCourse {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  lessons: LearningLesson[];
  tests: LearningCourseTest[];
  completed: boolean;
}

export interface LearningQuestion {
  id: string;
  text: string;
  kind: "CHOICE" | "OPEN";
  multiple: boolean;
  options: { id: string; text: string }[];
}

export interface LearningTest {
  id: string;
  title: string;
  description: string | null;
  courseId: string | null;
  courseTitle: string | null;
  passingScore: number;
  maxAttempts: number;
  attemptsUsed: number;
  state: LearningStatus;
  canTake: boolean;
  blockReason: "PASSED" | "IN_REVIEW" | "NO_ATTEMPTS" | "NO_QUESTIONS" | null;
  questions: LearningQuestion[];
  attempts: { id: string; status: "IN_REVIEW" | "GRADED"; passed: boolean | null; submittedAt: string }[];
}

export interface ReviewListItem {
  id: string;
  submittedAt: string;
  userName: string;
  department: string | null;
  testTitle: string;
  courseTitle: string | null;
}

export interface ReviewAnswer {
  id: string;
  text: string;
  kind: "CHOICE" | "OPEN";
  selectedTexts: string[];
  correctTexts: string[];
  isCorrect: boolean | null;
  textAnswer: string | null;
}

export interface ReviewDetail {
  id: string;
  status: "IN_REVIEW" | "GRADED";
  submittedAt: string;
  user: { fullName: string; department: string | null };
  test: { title: string; courseTitle: string | null };
  answers: ReviewAnswer[];
}

export type ReportState = "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "IN_REVIEW" | "FAILED";

export interface ReportItem {
  kind: "course" | "test";
  id: string;
  title: string;
  courseTitle: string | null;
  state: ReportState;
  percent: number | null;
  restricted: boolean;
}

export interface ReportEmployee {
  id: string;
  fullName: string;
  department: string | null;
  position: string | null;
  items: ReportItem[];
}

export interface ReportCourseRow {
  id: string;
  title: string;
  restricted: boolean;
  audience: number;
  notStarted: number;
  inProgress: number;
  done: number;
  notStartedNames: string[];
}

export interface ReportTestRow {
  id: string;
  title: string;
  courseTitle: string | null;
  passingScore: number;
  attempts: number;
  people: number;
  passedPeople: number;
  inReview: number;
  avgScore: number | null;
}

export interface LearningReport {
  employees: ReportEmployee[];
  courses: ReportCourseRow[];
  tests: ReportTestRow[];
}

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: [
    "Request",
    "Content",
    "Survey",
    "Onboarding",
    "Job",
    "Referral",
    "Org",
    "User",
    "Vacation",
    "Holiday",
    "Blocked",
    "OrgPerson",
    "Department",
    "Course",
    "Test",
    "Learning",
    "Review",
  ],
  endpoints: (builder) => ({
    getMyRequests: builder.query<RequestItem[], void>({
      query: () => "/requests",
      providesTags: ["Request"],
    }),
    createRequest: builder.mutation<RequestItem, Partial<RequestItem>>({
      query: (body) => ({ url: "/requests", method: "POST", body }),
      invalidatesTags: ["Request"],
    }),
    getAllRequests: builder.query<RequestItem[], void>({
      query: () => "/requests/admin",
      providesTags: ["Request"],
    }),
    updateRequestStatus: builder.mutation<
      RequestItem,
      { id: string; status: RequestStatus }
    >({
      query: ({ id, status }) => ({
        url: `/requests/${id}`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Request"],
    }),
getContent: builder.query<ContentItem[], { type?: string; types?: string[]; category?: string; q?: string; limit?: number }>({
  query: (params) => {
    const search = new URLSearchParams();
    if (params.type) search.set("type", params.type);
    if (params.types) search.set("types", params.types.join(","));
    if (params.category) search.set("category", params.category);
    if (params.q) search.set("q", params.q);
    if (params.limit) search.set("limit", String(params.limit));
    return `/content?${search.toString()}`;
  },
  providesTags: ["Content"],
}),
    createContent: builder.mutation<ContentItem, Partial<ContentItem>>({
      query: (body) => ({ url: "/content", method: "POST", body }),
      invalidatesTags: ["Content"],
    }),
    updateContent: builder.mutation<
      ContentItem,
      { id: string } & Partial<ContentItem>
    >({
      query: ({ id, ...body }) => ({
        url: `/content/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Content"],
    }),
    deleteContent: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/content/${id}`, method: "DELETE" }),
      invalidatesTags: ["Content"],
    }),
    getActiveSurveys: builder.query<SurveyItem[], void>({
      query: () => "/surveys",
      providesTags: ["Survey"],
    }),
    getAdminSurveys: builder.query<SurveyItem[], void>({
      query: () => "/surveys/admin",
      providesTags: ["Survey"],
    }),
    createSurvey: builder.mutation<SurveyItem, any>({
      query: (body) => ({ url: "/surveys", method: "POST", body }),
      invalidatesTags: ["Survey"],
    }),
    submitSurvey: builder.mutation<
      { ok: boolean },
      { id: string; answers: { questionId: string; value: string }[] }
    >({
      query: ({ id, answers }) => ({
        url: `/surveys/${id}/submit`,
        method: "POST",
        body: { answers },
      }),
      invalidatesTags: ["Survey"],
    }),
    getSurveyResults: builder.query<SurveyResults, string>({
      query: (id) => `/surveys/${id}/results`,
      providesTags: ["Survey"],
    }),
getUsers: builder.query<UserOption[], void>({
  query: () => "/users",
  providesTags: ["User"],
}), 
createUser: builder.mutation<
  { user: UserOption; tempPassword: string },
  { fullName: string; email: string; department?: string; position?: string; phone?: string; role: string; managerId?: string | null }
>({
  query: (body) => ({ url: "/users", method: "POST", body }),
  invalidatesTags: ["User","Department"],
}),

    getOnboardingAdmin: builder.query<OnboardingPlanItem[], void>({
      query: () => "/onboarding/admin",
      providesTags: ["Onboarding"],
    }),
    createOnboardingPlan: builder.mutation<OnboardingPlanItem, any>({
      query: (body) => ({ url: "/onboarding", method: "POST", body }),
      invalidatesTags: ["Onboarding"],
    }),
    addOnboardingTask: builder.mutation<
      OnboardingTaskItem,
      {
        planId: string;
        title: string;
        description?: string;
        dueDate?: string | null;
      }
    >({
      query: ({ planId, ...body }) => ({
        url: `/onboarding/${planId}/tasks`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Onboarding"],
    }),
    getMyOnboarding: builder.query<MyOnboarding, void>({
      query: () => "/onboarding/me",
      providesTags: ["Onboarding"],
    }),
    toggleOnboardingTask: builder.mutation<
      { ok: boolean },
      { taskId: string; done: boolean }
    >({
      query: ({ taskId, done }) => ({
        url: `/onboarding/tasks/${taskId}`,
        method: "PATCH",
        body: { done },
      }),
      invalidatesTags: ["Onboarding"],
    }),
    getTeamOnboarding: builder.query<OnboardingPlanItem[], void>({
  query: () => "/onboarding/team",
  providesTags: ["Onboarding"],
}),
    getActiveJobs: builder.query<JobPostingItem[], void>({
      query: () => "/jobs",
      providesTags: ["Job"],
    }),
    getAdminJobs: builder.query<JobPostingItem[], void>({
      query: () => "/jobs/admin",
      providesTags: ["Job"],
    }),
    createJob: builder.mutation<JobPostingItem, Partial<JobPostingItem>>({
      query: (body) => ({ url: "/jobs", method: "POST", body }),
      invalidatesTags: ["Job"],
    }),
    updateJob: builder.mutation<
      JobPostingItem,
      { id: string } & Partial<JobPostingItem>
    >({
      query: ({ id, ...body }) => ({
        url: `/jobs/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Job"],
    }),
    deleteJob: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/jobs/${id}`, method: "DELETE" }),
      invalidatesTags: ["Job"],
    }),
    createReferral: builder.mutation<
      ReferralItem,
      {
        jobId: string;
        candidateName: string;
        candidateContact: string;
        comment?: string;
      }
    >({
      query: ({ jobId, ...body }) => ({
        url: `/jobs/${jobId}/referrals`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Referral"],
    }),
    getMyReferrals: builder.query<ReferralItem[], void>({
      query: () => "/referrals/me",
      providesTags: ["Referral"],
    }),
    getAdminReferrals: builder.query<ReferralItem[], void>({
      query: () => "/referrals/admin",
      providesTags: ["Referral"],
    }),
    getOrgStructure: builder.query<Record<string, OrgUser[]>, void>({
      query: () => "/org",
    }),
    deleteRequest: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/requests/${id}`, method: "DELETE" }),
      invalidatesTags: ["Request"],
    }),
    deleteSurvey: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/surveys/${id}`, method: "DELETE" }),
      invalidatesTags: ["Survey"],
    }),
    getProfile: builder.query<ProfileData, void>({
      query: () => "/profile",
    }),
    getOrgDocuments: builder.query<OrgDocumentItem[], void>({
      query: () => "/org",
      providesTags: ["Org"],
    }),
createOrgDocument: builder.mutation<OrgDocumentItem, { title: string; description?: string; fileUrl?: string; fileName?: string }>({
  query: (body) => ({ url: "/org", method: "POST", body }),
  invalidatesTags: ["Org"],
}),
    deleteOrgDocument: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/org/${id}`, method: "DELETE" }),
      invalidatesTags: ["Org"],
    }),
    uploadFile: builder.mutation<{ url: string; name: string }, FormData>({
  query: (formData) => ({ url: "/upload", method: "POST", body: formData }),
}),
getContentById: builder.query<ContentItem, string>({
  query: (id) => `/content/${id}`,
  providesTags: ["Content"],
}),
getMyVacations: builder.query<VacationEntryItem[], void>({
  query: () => "/vacations",
  providesTags: ["Vacation"],
}),
createVacation: builder.mutation<VacationEntryItem, VacationInput>({
  query: (body) => ({ url: "/vacations", method: "POST", body }),
  invalidatesTags: ["Vacation"],
}),
deleteVacation: builder.mutation<{ id: string }, string>({
  query: (id) => ({ url: `/vacations/${id}`, method: "DELETE" }),
  invalidatesTags: ["Vacation"],
}),
getAdminVacations: builder.query<AdminVacationItem[], number>({
  query: (year) => `/vacations/admin?year=${year}`,
  providesTags: ["Vacation"],
}),
setVacationStatus: builder.mutation<VacationEntryItem, { id: string; status: "PLANNED" | "CONFIRMED" }>({
  query: ({ id, status }) => ({ url: `/vacations/${id}`, method: "PATCH", body: { status } }),
  invalidatesTags: ["Vacation"],
}),
getHolidays: builder.query<HolidayItem[], void>({
  query: () => "/holidays",
  providesTags: ["Holiday"],
}),
addHolidays: builder.mutation<{ created: number }, { items: { date: string; name: string }[] }>({
  query: (body) => ({ url: "/holidays", method: "POST", body }),
  invalidatesTags: ["Holiday"],
}),
deleteHoliday: builder.mutation<{ id: string }, string>({
  query: (id) => ({ url: `/holidays/${id}`, method: "DELETE" }),
  invalidatesTags: ["Holiday"],
}),
getBlockedPeriods: builder.query<BlockedPeriodItem[], void>({
  query: () => "/blocked-periods",
  providesTags: ["Blocked"],
}),
createBlockedPeriod: builder.mutation<BlockedPeriodItem, { startDate: string; endDate: string; reason: string }>({
  query: (body) => ({ url: "/blocked-periods", method: "POST", body }),
  invalidatesTags: ["Blocked"],
}),
deleteBlockedPeriod: builder.mutation<{ id: string }, string>({
  query: (id) => ({ url: `/blocked-periods/${id}`, method: "DELETE" }),
  invalidatesTags: ["Blocked"],
}),
getOrgPeople: builder.query<OrgPersonItem[], void>({
  query: () => "/org-people",
  providesTags: ["OrgPerson"],
}),
createOrgPerson: builder.mutation<OrgPersonItem, Partial<OrgPersonItem>>({
  query: (body) => ({ url: "/org-people", method: "POST", body }),
  invalidatesTags: ["OrgPerson", "Department"],
}),
updateOrgPerson: builder.mutation<OrgPersonItem, { id: string } & Partial<OrgPersonItem>>({
  query: ({ id, ...body }) => ({ url: `/org-people/${id}`, method: "PATCH", body }),
  invalidatesTags: ["OrgPerson","Department"],
}),
deleteOrgPerson: builder.mutation<{ id: string }, string>({
  query: (id) => ({ url: `/org-people/${id}`, method: "DELETE" }),
  invalidatesTags: ["OrgPerson"],
}),
getMyOrgPerson: builder.query<MyOrgPerson | null, void>({
  query: () => "/org-people/me",
}),
updateUser: builder.mutation<UserOption, { id: string } & Partial<UserOption>>({
  query: ({ id, ...body }) => ({ url: `/users/${id}`, method: "PATCH", body }),
  invalidatesTags: ["User","Department"],
}),
deleteUser: builder.mutation<{ id: string }, string>({
  query: (id) => ({ url: `/users/${id}`, method: "DELETE" }),
  invalidatesTags: ["User"],
}),
getDepartments: builder.query<DepartmentItem[], void>({
  query: () => "/departments",
  providesTags: ["Department"],
}),
createDepartment: builder.mutation<DepartmentItem, { name: string; color?: string }>({
  query: (body) => ({ url: "/departments", method: "POST", body }),
  invalidatesTags: ["Department"],
}),
updateDepartmentColor: builder.mutation<DepartmentItem, { id: string; color: string }>({
  query: ({ id, color }) => ({ url: `/departments/${id}`, method: "PATCH", body: { color } }),
  invalidatesTags: ["Department"],
}),
deleteDepartment: builder.mutation<{ id: string }, string>({
  query: (id) => ({ url: `/departments/${id}`, method: "DELETE" }),
  invalidatesTags: ["Department"],
}),
getTeamRequests: builder.query<RequestItem[], void>({
  query: () => "/requests/team",
  providesTags: ["Request"],
}),
getTeamUsers: builder.query<UserOption[], void>({
  query: () => "/users/team",
  providesTags: ["User"],
}),
deleteOnboardingTask: builder.mutation<{ id: string }, string>({
  query: (taskId) => ({ url: `/onboarding/tasks/${taskId}`, method: "DELETE" }),
  invalidatesTags: ["Onboarding"],
}),
getAdminCourses: builder.query<CourseSummary[], void>({
  query: () => "/courses/admin",
  providesTags: ["Course"],
}),
createCourse: builder.mutation<{ id: string }, { title: string; description?: string; category?: string; accessMode: "OPEN" | "RESTRICTED" }>({
  query: (body) => ({ url: "/courses/admin", method: "POST", body }),
  invalidatesTags: ["Course"],
}),
getAdminCourse: builder.query<CourseDetail, string>({
  query: (id) => `/courses/admin/${id}`,
  providesTags: ["Course"],
}),
updateCourse: builder.mutation<
  { id: string },
  { id: string; title?: string; description?: string; category?: string; accessMode?: "OPEN" | "RESTRICTED"; status?: "DRAFT" | "PUBLISHED" }
>({
  query: ({ id, ...body }) => ({ url: `/courses/admin/${id}`, method: "PATCH", body }),
  invalidatesTags: ["Course"],
}),
deleteCourse: builder.mutation<{ id: string }, string>({
  query: (id) => ({ url: `/courses/admin/${id}`, method: "DELETE" }),
  invalidatesTags: ["Course"],
}),
addLesson: builder.mutation<LessonItem, { courseId: string; title: string; content: string; videoUrl?: string; files?: ContentFile[] }>({
  query: ({ courseId, ...body }) => ({ url: `/courses/admin/${courseId}/lessons`, method: "POST", body }),
  invalidatesTags: ["Course"],
}),
updateLesson: builder.mutation<LessonItem, { lessonId: string; title?: string; content?: string; videoUrl?: string; files?: ContentFile[] }>({
  query: ({ lessonId, ...body }) => ({ url: `/lessons/${lessonId}`, method: "PATCH", body }),
  invalidatesTags: ["Course"],
}),
deleteLesson: builder.mutation<{ id: string }, string>({
  query: (lessonId) => ({ url: `/lessons/${lessonId}`, method: "DELETE" }),
  invalidatesTags: ["Course"],
}),
getAdminTests: builder.query<TestListItem[], void>({
  query: () => "/tests/admin",
  providesTags: ["Test"],
}),
createTest: builder.mutation<
  { id: string },
  { title: string; description?: string; category?: string; accessMode?: "OPEN" | "RESTRICTED"; courseId?: string }
>({
  query: (body) => ({ url: "/tests/admin", method: "POST", body }),
  invalidatesTags: ["Test", "Course"],
}),
getAdminTest: builder.query<TestDetail, string>({
  query: (id) => `/tests/admin/${id}`,
  providesTags: ["Test"],
}),
updateTest: builder.mutation<
  { id: string },
  {
    id: string;
    title?: string;
    description?: string;
    category?: string;
    accessMode?: "OPEN" | "RESTRICTED";
    status?: "DRAFT" | "PUBLISHED";
    passingScore?: number;
    maxAttempts?: number;
  }
>({
  query: ({ id, ...body }) => ({ url: `/tests/admin/${id}`, method: "PATCH", body }),
  invalidatesTags: ["Test", "Course"],
}),
deleteTest: builder.mutation<{ id: string }, string>({
  query: (id) => ({ url: `/tests/admin/${id}`, method: "DELETE" }),
  invalidatesTags: ["Test", "Course"],
}),
addQuestion: builder.mutation<
  { id: string },
  { testId: string; text: string; kind: "CHOICE" | "OPEN"; options: { text: string; isCorrect: boolean }[] }
>({
  query: ({ testId, ...body }) => ({ url: `/tests/admin/${testId}/questions`, method: "POST", body }),
  invalidatesTags: ["Test", "Course"],
}),
grantTestAccess: builder.mutation<{ granted: number }, { testId: string; userIds?: string[]; department?: string }>({
  query: ({ testId, ...body }) => ({ url: `/tests/admin/${testId}/access`, method: "POST", body }),
  invalidatesTags: ["Test"],
}),
revokeTestAccess: builder.mutation<{ userId: string }, { testId: string; userId: string }>({
  query: ({ testId, userId }) => ({ url: `/tests/admin/${testId}/access/${userId}`, method: "DELETE" }),
  invalidatesTags: ["Test"],
}),


deleteQuestion: builder.mutation<{ id: string }, string>({
  query: (questionId) => ({ url: `/test-questions/${questionId}`, method: "DELETE" }),
  invalidatesTags: ["Test", "Course"],
}),
grantCourseAccess: builder.mutation<{ granted: number }, { courseId: string; userIds?: string[]; department?: string }>({
  query: ({ courseId, ...body }) => ({ url: `/courses/admin/${courseId}/access`, method: "POST", body }),
  invalidatesTags: ["Course"],
}),
revokeCourseAccess: builder.mutation<{ userId: string }, { courseId: string; userId: string }>({
  query: ({ courseId, userId }) => ({ url: `/courses/admin/${courseId}/access/${userId}`, method: "DELETE" }),
  invalidatesTags: ["Course"],
}),
getLearning: builder.query<LearningOverview, void>({
  query: () => "/learning",
  providesTags: ["Learning"],
}),
getLearningCourse: builder.query<LearningCourse, string>({
  query: (id) => `/learning/courses/${id}`,
  providesTags: ["Learning"],
}),
completeLesson: builder.mutation<{ lessonId: string }, { lessonId: string; done: boolean }>({
  query: ({ lessonId, done }) => ({ url: `/learning/lessons/${lessonId}/complete`, method: "POST", body: { done } }),
  invalidatesTags: ["Learning"],
}),
getLearningTest: builder.query<LearningTest, string>({
  query: (id) => `/learning/tests/${id}`,
  providesTags: ["Learning"],
}),
submitAttempt: builder.mutation<
  { id: string; status: "IN_REVIEW" | "GRADED"; passed: boolean | null },
  { testId: string; answers: { questionId: string; selectedOptionIds?: string[]; textAnswer?: string }[] }
>({
  query: ({ testId, answers }) => ({ url: `/learning/tests/${testId}/attempts`, method: "POST", body: { answers } }),
  invalidatesTags: ["Learning", "Review", "Test"],
}),
getReviews: builder.query<ReviewListItem[], void>({
  query: () => "/reviews",
  providesTags: ["Review"],
}),
getReview: builder.query<ReviewDetail, string>({
  query: (id) => `/reviews/${id}`,
  providesTags: ["Review"],
}),
submitReview: builder.mutation<{ passed: boolean; score: number }, { attemptId: string; verdicts: Record<string, boolean> }>({
  query: ({ attemptId, verdicts }) => ({ url: `/reviews/${attemptId}`, method: "POST", body: { verdicts } }),
  invalidatesTags: ["Review", "Learning", "Test"],
}),
getLearningReport: builder.query<LearningReport, void>({
  query: () => "/reports/learning",
  providesTags: ["Learning", "Review"],
}),
getTeamLearning: builder.query<{ employees: ReportEmployee[] }, void>({
  query: () => "/learning/team",
  providesTags: ["Learning"],
}),

  }),
});

export const {
  useGetMyRequestsQuery,
  useCreateRequestMutation,
  useGetAllRequestsQuery,
  useUpdateRequestStatusMutation,
  useGetContentQuery,
  useCreateContentMutation,
  useUpdateContentMutation,
  useDeleteContentMutation,
  useGetActiveSurveysQuery,
  useGetAdminSurveysQuery,
  useCreateSurveyMutation,
  useSubmitSurveyMutation,
  useGetSurveyResultsQuery,
  useGetUsersQuery,
  useGetOnboardingAdminQuery,
  useCreateOnboardingPlanMutation,
  useAddOnboardingTaskMutation,
  useGetMyOnboardingQuery,
  useToggleOnboardingTaskMutation,
  useGetActiveJobsQuery,
  useGetAdminJobsQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
  useCreateReferralMutation,
  useGetMyReferralsQuery,
  useGetAdminReferralsQuery,
  useGetOrgStructureQuery,
  useDeleteRequestMutation,
  useDeleteSurveyMutation,
  useGetProfileQuery,
  useGetOrgDocumentsQuery,
  useCreateOrgDocumentMutation,
  useDeleteOrgDocumentMutation, 
  useUploadFileMutation,
  useGetContentByIdQuery,
  useCreateUserMutation,
  useGetMyVacationsQuery, 
  useCreateVacationMutation,
  useDeleteVacationMutation,
  useGetAdminVacationsQuery,
  useSetVacationStatusMutation, 
  useGetHolidaysQuery, 
  useAddHolidaysMutation, 
  useDeleteHolidayMutation, 
  useGetBlockedPeriodsQuery, 
  useCreateBlockedPeriodMutation, 
  useDeleteBlockedPeriodMutation, 
  useGetOrgPeopleQuery, 
  useCreateOrgPersonMutation, 
  useUpdateOrgPersonMutation, 
  useDeleteOrgPersonMutation, 
  useGetMyOrgPersonQuery, 
  useUpdateUserMutation, 
  useDeleteUserMutation,
  useGetDepartmentsQuery, 
  useCreateDepartmentMutation, 
  useUpdateDepartmentColorMutation, 
  useDeleteDepartmentMutation,
  useGetTeamRequestsQuery,
  useGetTeamOnboardingQuery,
  useGetTeamUsersQuery,
  useDeleteOnboardingTaskMutation,
  useGetAdminCoursesQuery,
  useCreateCourseMutation, 
  useGetAdminCourseQuery, 
  useUpdateCourseMutation, 
  useDeleteCourseMutation, 
  useAddLessonMutation, 
  useUpdateLessonMutation, 
  useDeleteLessonMutation,
  useDeleteQuestionMutation, 
  useGrantCourseAccessMutation, 
  useRevokeCourseAccessMutation, 
  useGetAdminTestsQuery, 
  useCreateTestMutation, 
  useGetAdminTestQuery, 
  useUpdateTestMutation, 
  useDeleteTestMutation, 
  useAddQuestionMutation, 
  useGrantTestAccessMutation, 
  useRevokeTestAccessMutation, 
  useGetLearningQuery, 
  useGetLearningCourseQuery, 
  useCompleteLessonMutation, 
  useGetLearningTestQuery, 
  useSubmitAttemptMutation, 
  useGetReviewsQuery, 
  useGetReviewQuery, 
  useSubmitReviewMutation, 
  useGetLearningReportQuery, 
  useGetTeamLearningQuery
} = apiSlice;
