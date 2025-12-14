export interface AutodeskTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface AutodeskAuthContext {
  accessToken: string;
  expiresAt: number;
  refreshToken?: string;
}
