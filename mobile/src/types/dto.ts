export type AuthResponse = {
  id: number; username: string; token: string; tokenType: "Bearer"; expiresIn: number;
};

export type ReportUserDto = { id: number; username: string };

export type ReportPropertiesDto = {
  id: number; type: string; occurredAt: string; createdAt: string; updatedAt?: string | null;
  status: string; upvotes: number; upvotedByMe: boolean; description: string; user: ReportUserDto;
};

export type CreateReportRequest = {
  type: string; description: string; occurredAt: string; lat: number; lng: number;
};

export type CreateReportResponse = {
  id: number; status: string; createdAt: string; updatedAt?: string | null;
};
