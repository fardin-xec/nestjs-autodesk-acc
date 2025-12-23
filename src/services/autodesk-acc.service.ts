// src/services/autodesk-acc.service.ts
import { Injectable } from '@nestjs/common';
import { AutodeskAuthService } from './autodesk-auth.service';
import { AutodeskProjectService } from './autodesk-project.service';
import { AutodeskDataManagementService } from './autodesk-data-management.service';

/**
 * Main service that provides access to all Autodesk ACC functionality
 */
@Injectable()
export class AutodeskAccService {
  constructor(
    public readonly auth: AutodeskAuthService,
    public readonly projects: AutodeskProjectService,
    public readonly dataManagement: AutodeskDataManagementService,
  ) {}

  /**
   * Quick access methods for common operations
   */

  /**
   * Upload a file to a specific folder
   */
  async uploadFile(
    projectId: string,
    folderId: string,
    fileName: string,
    fileBuffer: Buffer,
    contentType?: string,
  ) {
    return this.dataManagement.uploadFile({
      projectId,
      folderId,
      fileName,
      fileBuffer,
      contentType,
    });
  }

  /**
   * Get all projects for a hub
   */
  async getProjects(hubId: string) {
    return this.projects.getProjects(hubId);
  }

  /**
   * Get folder contents
   */
  async getFolderContents(projectId: string, folderId: string) {
    return this.dataManagement.getFolderContents(projectId, folderId);
  }

  /**
   * Create a new folder
   */
  async createFolder(projectId: string, parentFolderId: string, folderName: string) {
    return this.dataManagement.createFolder(projectId, parentFolderId, folderName);
  }

   async createRotFolder(projectId: string, folderName: string) {
    return this.dataManagement.createRootFolder(projectId, folderName);
  }

  /**
   * Get all accessible hubs
   */
  async getHubs() {
    return this.projects.getHubs();
  }

  /**
   * Delete an item
   */
  async deleteItem(projectId: string, itemId: string) {
    return this.dataManagement.deleteItem(projectId, itemId);
  }
}