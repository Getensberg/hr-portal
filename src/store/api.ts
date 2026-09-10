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

export interface SurveyResults {
  survey: { id: string; title: string; isAnonymous: boolean };
  completionsCount: number;
  questions: SurveyResultQuestion[];
}

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Request", "Content", "Survey"],
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
} = apiSlice;