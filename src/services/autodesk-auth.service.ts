// src/services/autodesk-auth.service.ts
import { Injectable, Inject, Logger, UnauthorizedException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { AUTODESK_ACC_OPTIONS, AUTODESK_AUTH_URL } from '../constants';
import { AutodeskAccModuleOptions } from '../interfaces/module-options.interface';
import { AutodeskTokenResponse, AutodeskAuthContext } from '../interfaces/auth.interface';

@Injectable()
export class AutodeskAuthService {
  private readonly logger = new Logger(AutodeskAuthService.name);
  private readonly httpClient: AxiosInstance;
  private authContext: AutodeskAuthContext | null = null;

  constructor(
    @Inject(AUTODESK_ACC_OPTIONS)
    private readonly options: AutodeskAccModuleOptions,
  ) {
    this.httpClient = axios.create({
      baseURL: AUTODESK_AUTH_URL,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  /**
   * Authenticate using client credentials (2-legged OAuth)
   */
  async authenticate(): Promise<string> {
    try {
      // Check if we have a valid token
      if (this.authContext && this.isTokenValid()) {
        return this.authContext.accessToken;
      }

      // Get new token
      const scopes = this.options.scopes || [
        'data:read',
        'data:write',
        'data:create',
        'bucket:read',
        'bucket:create',
      ];

      const params = new URLSearchParams({
        client_id: this.options.clientId,
        client_secret: this.options.clientSecret,
        grant_type: 'client_credentials',
        scope: scopes.join(' '),
      });

      const response = await this.httpClient.post<AutodeskTokenResponse>('', params.toString());

      this.authContext = {
        accessToken: response.data.access_token,
        expiresAt: Date.now() + response.data.expires_in * 1000,
        refreshToken: response.data.refresh_token,
      };

      this.logger.log('Successfully authenticated with Autodesk');
      return this.authContext.accessToken;
    } catch (error) {
      this.logger.error('Authentication failed', error.response?.data || error.message);
      throw new UnauthorizedException('Failed to authenticate with Autodesk ACC');
    }
  }

  /**
   * Get 3-legged OAuth authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const scopes = this.options.scopes || ['data:read', 'data:write', 'data:create'];
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.options.clientId,
      redirect_uri: this.options.callbackUrl || '',
      scope: scopes.join(' '),
    });

    if (state) {
      params.append('state', state);
    }

    return `https://developer.api.autodesk.com/authentication/v2/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token (3-legged OAuth)
   */
  async getAccessTokenFromCode(code: string): Promise<AutodeskAuthContext> {
    try {
      const params = new URLSearchParams({
        client_id: this.options.clientId,
        client_secret: this.options.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.options.callbackUrl || '',
      });

      const response = await this.httpClient.post<AutodeskTokenResponse>('', params.toString());

      const authContext: AutodeskAuthContext = {
        accessToken: response.data.access_token,
        expiresAt: Date.now() + response.data.expires_in * 1000,
        refreshToken: response.data.refresh_token,
      };

      return authContext;
    } catch (error) {
      this.logger.error('Failed to exchange code for token', error.response?.data || error.message);
      throw new UnauthorizedException('Failed to exchange authorization code');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<AutodeskAuthContext> {
    try {
      const params = new URLSearchParams({
        client_id: this.options.clientId,
        client_secret: this.options.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      });

      const response = await this.httpClient.post<AutodeskTokenResponse>('', params.toString());

      const authContext: AutodeskAuthContext = {
        accessToken: response.data.access_token,
        expiresAt: Date.now() + response.data.expires_in * 1000,
        refreshToken: response.data.refresh_token || refreshToken,
      };

      return authContext;
    } catch (error) {
      this.logger.error('Failed to refresh token', error.response?.data || error.message);
      throw new UnauthorizedException('Failed to refresh access token');
    }
  }

  /**
   * Check if current token is still valid
   */
  private isTokenValid(): boolean {
    if (!this.authContext) return false;
    // Add 5-minute buffer before expiration
    return Date.now() < this.authContext.expiresAt - 300000;
  }

  /**
   * Get current access token (with auto-refresh)
   */
  async getAccessToken(): Promise<string> {
    return this.authenticate();
  }

  /**
   * Clear authentication context
   */
  clearAuth(): void {
    this.authContext = null;
  }
}