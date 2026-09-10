import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RequestType, RequestStatus, ContentType } from "@/generated/prisma/client";
import type { SurveyFrequency, QuestionType } from "@/generated/prisma/client";

export interface RequestItem {
  id: string;
  type: RequestType;
  status: RequestStatus;
  payload: Record<string, any> | null;
  note: string | null;
  requestedAt: string;
  completedAt: string | null;
  user?: { fullName: string; email: string; department: string | null };
}

export interface ContentItem {
  id: string;
  title: string;
  content: string;
  type: ContentType;
  category: string | null;
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
}

export interface OnboardingTaskItem {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  done?: boolean;
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
  plan: { id: string; mentor: { fullName: string; email: string } | null; startDate: string; endDate: string | null } | null;
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

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Request", "Content", "Survey", "Onboarding", "Job", "Referral"],
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
    updateRequestStatus: builder.mutation<RequestItem, { id: string; status: RequestStatus }>({
      query: ({ id, status }) => ({ url: `/requests/${id}`, method: "PATCH", body: { status } }),
      invalidatesTags: ["Request"],
    }),
    getContent: builder.query<ContentItem[], { type?: string; category?: string; q?: string }>({
      query: (params) => {
        const search = new URLSearchParams();
        if (params.type) search.set("type", params.type);
        if (params.category) search.set("category", params.category);
        if (params.q) search.set("q", params.q);
        return `/content?${search.toString()}`;
      },
      providesTags: ["Content"],
    }),
    createContent: builder.mutation<ContentItem, Partial<ContentItem>>({
      query: (body) => ({ url: "/content", method: "POST", body }),
      invalidatesTags: ["Content"],
    }),
    updateContent: builder.mutation<ContentItem, { id: string } & Partial<ContentItem>>({
      query: ({ id, ...body }) => ({ url: `/content/${id}`, method: "PATCH", body }),
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
    submitSurvey: builder.mutation<{ ok: boolean }, { id: string; answers: { questionId: string; value: string }[] }>({
      query: ({ id, answers }) => ({ url: `/surveys/${id}/submit`, method: "POST", body: { answers } }),
      invalidatesTags: ["Survey"],
    }),
    getSurveyResults: builder.query<SurveyResults, string>({
      query: (id) => `/surveys/${id}/results`,
      providesTags: ["Survey"],
    }),
    getUsers: builder.query<UserOption[], void>({
  query: () => "/users",
  }),
  getOnboardingAdmin: builder.query<OnboardingPlanItem[], void>({
    query: () => "/onboarding/admin",
    providesTags: ["Onboarding"],
  }),
  createOnboardingPlan: builder.mutation<OnboardingPlanItem, any>({
    query: (body) => ({ url: "/onboarding", method: "POST", body }),
    invalidatesTags: ["Onboarding"],
  }),
  addOnboardingTask: builder.mutation<OnboardingTaskItem, { planId: string; title: string; description?: string; dueDate?: string | null }>({
    query: ({ planId, ...body }) => ({ url: `/onboarding/${planId}/tasks`, method: "POST", body }),
    invalidatesTags: ["Onboarding"],
  }),
  getMyOnboarding: builder.query<MyOnboarding, void>({
    query: () => "/onboarding/me",
    providesTags: ["Onboarding"],
  }),
  toggleOnboardingTask: builder.mutation<{ ok: boolean }, { taskId: string; done: boolean }>({
    query: ({ taskId, done }) => ({ url: `/onboarding/tasks/${taskId}`, method: "PATCH", body: { done } }),
    invalidatesTags: ["Onboarding"],
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
  updateJob: builder.mutation<JobPostingItem, { id: string } & Partial<JobPostingItem>>({
    query: ({ id, ...body }) => ({ url: `/jobs/${id}`, method: "PATCH", body }),
    invalidatesTags: ["Job"],
  }),
  deleteJob: builder.mutation<{ id: string }, string>({
    query: (id) => ({ url: `/jobs/${id}`, method: "DELETE" }),
    invalidatesTags: ["Job"],
  }),
  createReferral: builder.mutation<ReferralItem, { jobId: string; candidateName: string; candidateContact: string; comment?: string }>({
    query: ({ jobId, ...body }) => ({ url: `/jobs/${jobId}/referrals`, method: "POST", body }),
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
} = apiSlice;