import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RequestType, RequestStatus } from "@/generated/prisma/client";

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

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Request"],
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
  }),
});

export const {
  useGetMyRequestsQuery,
  useCreateRequestMutation,
  useGetAllRequestsQuery,
  useUpdateRequestStatusMutation,
} = apiSlice;