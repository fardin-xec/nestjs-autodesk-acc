// src/services/autodesk-project.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { AutodeskAuthService } from './autodesk-auth.service';
import { AUTODESK_BASE_URL } from '../constants';
import { AutodeskHub, AutodeskProject } from '../interfaces';

@Injectable()
export class AutodeskProjectService {
  private readonly logger = new Logger(AutodeskProjectService.name);
  private readonly httpClient: AxiosInstance;

  constructor(private readonly authService: AutodeskAuthService) {
    this.httpClient = axios.create({
      baseURL: AUTODESK_BASE_URL,
    });

    // Add request interceptor to attach auth token
    this.httpClient.interceptors.request.use(async (config) => {
      const token = await this.authService.getAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  /**
   * Get all hubs (accounts) accessible to the user
   */
  async getHubs(): Promise<AutodeskHub[]> {
    try {
      const response = await this.httpClient.get('/project/v1/hubs');
      return response.data.data;
    } catch (error) {
      this.logger.error('Failed to fetch hubs', error.response?.data || error.message);
      throw new Error('Failed to fetch Autodesk hubs');
    }
  }

  /**
   * Get a specific hub by ID
   */
  async getHub(hubId: string): Promise<AutodeskHub> {
    try {
      const response = await this.httpClient.get(`/project/v1/hubs/${hubId}`);
      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to fetch hub ${hubId}`, error.response?.data || error.message);
      throw new NotFoundException(`Hub ${hubId} not found`);
    }
  }

  /**
   * Get all projects within a hub
   */
  async getProjects(hubId: string): Promise<AutodeskProject[]> {
    try {
      const response = await this.httpClient.get(`/project/v1/hubs/${hubId}/projects`);
      return response.data.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch projects for hub ${hubId}`,
        error.response?.data || error.message,
      );
      throw new Error(`Failed to fetch projects for hub ${hubId}`);
    }
  }

  /**
   * Get a specific project by ID
   */
  async getProject(hubId: string, projectId: string): Promise<AutodeskProject> {
    try {
      const response = await this.httpClient.get(
        `/project/v1/hubs/${hubId}/projects/${projectId}`,
      );
      return response.data.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch project ${projectId}`,
        error.response?.data || error.message,
      );
      throw new NotFoundException(`Project ${projectId} not found`);
    }
  }

  /**
   * Get top folders for a project
   */
  async getProjectTopFolders(hubId: string, projectId: string): Promise<any[]> {
    try {
      const response = await this.httpClient.get(
        `/project/v1/hubs/${hubId}/projects/${projectId}/topFolders`,
      );
      return response.data.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch top folders for project ${projectId}`,
        error.response?.data || error.message,
      );
      throw new Error(`Failed to fetch top folders for project ${projectId}`);
    }
  }
}