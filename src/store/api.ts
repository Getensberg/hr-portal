import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RequestType, RequestStatus, ContentType } from "@/generated/prisma/client";

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

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Request", "Content"],
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
} = apiSlice;