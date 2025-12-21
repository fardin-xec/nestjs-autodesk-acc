// src/services/autodesk-data-management.service.ts
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { AutodeskAuthService } from './autodesk-auth.service';
import { AUTODESK_BASE_URL } from '../constants';
import { AutodeskFolder, AutodeskItem, UploadFileOptions, AutodeskStorageLocation } from '../interfaces';

@Injectable()
export class AutodeskDataManagementService {
  private readonly logger = new Logger(AutodeskDataManagementService.name);
  private readonly httpClient: AxiosInstance;

  constructor(private readonly authService: AutodeskAuthService) {
    this.httpClient = axios.create({
      baseURL: AUTODESK_BASE_URL,
    });

    // Add request interceptor for auth
    this.httpClient.interceptors.request.use(async (config) => {
      const token = await this.authService.getAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  /**
   * Get folder contents
   */
  async getFolderContents(projectId: string, folderId: string): Promise<{
    folders: AutodeskFolder[];
    items: AutodeskItem[];
  }> {
    try {
      const response = await this.httpClient.get(
        `/data/v1/projects/${projectId}/folders/${folderId}/contents`,
      );

      const folders = response.data.data.filter((item: any) => item.type === 'folders');
      const items = response.data.data.filter((item: any) => item.type === 'items');

      return { folders, items };
    } catch (error) {
      this.logger.error(
        `Failed to fetch folder contents for ${folderId}`,
        error.response?.data || error.message,
      );
      throw new Error(`Failed to fetch folder contents`);
    }
  }

  /**
   * Get folder details
   */
  async getFolder(projectId: string, folderId: string): Promise<AutodeskFolder> {
    try {
      const response = await this.httpClient.get(
        `/data/v1/projects/${projectId}/folders/${folderId}`,
      );
      return response.data.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch folder ${folderId}`,
        error.response?.data || error.message,
      );
      throw new NotFoundException(`Folder ${folderId} not found`);
    }
  }

  /**
   * Create a new folder (FIXED VERSION)
   * Automatically detects the correct folder type from parent
   */
  async createFolder(
    projectId: string,
    parentFolderId: string,
    folderName: string,
  ): Promise<AutodeskFolder> {
    try {
      // Step 1: Get parent folder to determine correct extension type
      const parentFolder = await this.getFolder(projectId, parentFolderId);
      
      // Step 2: Determine the correct extension type
      let extensionType = 'folders:autodesk.bim360:Folder'; // Default for ACC projects
      
      if (parentFolder.attributes?.extension?.type) {
        const parentType = parentFolder.attributes.extension.type;
        
        // Match the parent's folder type
        if (parentType.includes('bim360')) {
          extensionType = 'folders:autodesk.bim360:Folder';
        } else if (parentType.includes('core')) {
          extensionType = 'folders:autodesk.core:Folder';
        }
      }

      this.logger.log(`Creating folder with extension type: ${extensionType}`);

      // Step 3: Create the folder with correct extension
      const body = {
        jsonapi: { version: '1.0' },
        data: {
          type: 'folders',
          attributes: {
            name: folderName,
            extension: {
              type: extensionType,
              version: '1.0',
            },
          },
          relationships: {
            parent: {
              data: {
                type: 'folders',
                id: parentFolderId,
              },
            },
          },
        },
      };

      const response = await this.httpClient.post(
        `/data/v1/projects/${projectId}/folders`,
        body,
      );
      
      this.logger.log(`Created folder: ${folderName}`);
      return response.data.data;
    } catch (error) {
      this.logger.error(
        `Failed to create folder ${folderName}`,
        error.response?.data || error.message,
      );
      
      // Log the full error for debugging
      if (error.response?.data) {
        this.logger.error('Error details:', JSON.stringify(error.response.data, null, 2));
      }
      
      throw new BadRequestException(`Failed to create folder: ${folderName}`);
    }
  }

  /**
   * Create folder with explicit extension type (alternative method)
   */
  async createFolderWithType(
    projectId: string,
    parentFolderId: string,
    folderName: string,
    extensionType: string = 'folders:autodesk.bim360:Folder',
  ): Promise<AutodeskFolder> {
    try {
      const body = {
        jsonapi: { version: '1.0' },
        data: {
          type: 'folders',
          attributes: {
            name: folderName,
            extension: {
              type: extensionType,
              version: '1.0',
            },
          },
          relationships: {
            parent: {
              data: {
                type: 'folders',
                id: parentFolderId,
              },
            },
          },
        },
      };

      this.logger.log(`Creating folder with type: ${extensionType}`);
      
      const response = await this.httpClient.post(
        `/data/v1/projects/${projectId}/folders`,
        body,
      );
      
      this.logger.log(`Created folder: ${folderName}`);
      return response.data.data;
    } catch (error) {
      this.logger.error(
        `Failed to create folder ${folderName}`,
        error.response?.data || error.message,
      );
      
      if (error.response?.data) {
        this.logger.error('Error details:', JSON.stringify(error.response.data, null, 2));
      }
      
      throw new BadRequestException(`Failed to create folder: ${folderName}`);
    }
  }

  /**
   * Get item (file) details
   */
  async getItem(projectId: string, itemId: string): Promise<AutodeskItem> {
    try {
      const response = await this.httpClient.get(
        `/data/v1/projects/${projectId}/items/${itemId}`,
      );
      return response.data.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch item ${itemId}`,
        error.response?.data || error.message,
      );
      throw new NotFoundException(`Item ${itemId} not found`);
    }
  }

  /**
   * Upload a file to ACC
   */
  async uploadFile(options: UploadFileOptions): Promise<AutodeskItem> {
    const { fileName, folderId, projectId, fileBuffer, contentType } = options;

    try {
      // Step 1: Create storage location
      const storage = await this.createStorage(projectId, folderId, fileName);

      // Step 2: Upload file to storage
      await this.uploadToStorage(storage.objectId, fileBuffer, contentType);

      // Step 3: Create first version of the item
      const item = await this.createFirstVersion(
        projectId,
        folderId,
        fileName,
        storage.objectId,
      );

      this.logger.log(`Successfully uploaded file: ${fileName}`);
      return item;
    } catch (error) {
      this.logger.error(
        `Failed to upload file ${fileName}`,
        error.response?.data || error.message,
      );
      throw new BadRequestException(`Failed to upload file: ${error}`);
    }
  }

  /**
   * Create storage location for file
   */
  private async createStorage(
    projectId: string,
    folderId: string,
    fileName: string,
  ): Promise<AutodeskStorageLocation> {
    const body = {
      jsonapi: { version: '1.0' },
      data: {
        type: 'objects',
        attributes: {
          name: fileName,
        },
        relationships: {
          target: {
            data: {
              type: 'folders',
              id: folderId,
            },
          },
        },
      },
    };

    const response = await this.httpClient.post(
      `/data/v1/projects/${projectId}/storage`,
      body,
    );

    return response.data.data;
  }

  /**
   * Upload file buffer to storage
   */
  private async uploadToStorage(
    objectId: string,
    fileBuffer: Buffer,
    contentType = 'application/octet-stream',
  ): Promise<void> {
    // Extract bucket key and object key from objectId
    const matches = objectId.match(/urn:adsk\.objects:os\.object:([^/]+)\/(.+)/);
    if (!matches) {
      throw new BadRequestException('Invalid object ID format');
    }

    const [, bucketKey, objectKey] = matches;

    await this.httpClient.put(
      `/oss/v2/buckets/${bucketKey}/objects/${encodeURIComponent(objectKey)}`,
      fileBuffer,
      {
        headers: {
          'Content-Type': contentType,
          'Content-Length': fileBuffer.length,
        },
      },
    );
  }

  /**
   * Create first version of item
   */
  private async createFirstVersion(
    projectId: string,
    folderId: string,
    fileName: string,
    objectId: string,
  ): Promise<AutodeskItem> {
    const body = {
      jsonapi: { version: '1.0' },
      data: {
        type: 'items',
        attributes: {
          displayName: fileName,
          extension: {
            type: 'items:autodesk.core:File',
            version: '1.0',
          },
        },
        relationships: {
          tip: {
            data: {
              type: 'versions',
              id: '1',
            },
          },
          parent: {
            data: {
              type: 'folders',
              id: folderId,
            },
          },
        },
      },
      included: [
        {
          type: 'versions',
          id: '1',
          attributes: {
            name: fileName,
            extension: {
              type: 'versions:autodesk.core:File',
              version: '1.0',
            },
          },
          relationships: {
            storage: {
              data: {
                type: 'objects',
                id: objectId,
              },
            },
          },
        },
      ],
    };

    const response = await this.httpClient.post(
      `/data/v1/projects/${projectId}/items`,
      body,
    );

    return response.data.data;
  }

  /**
   * Delete an item
   */
  async deleteItem(projectId: string, itemId: string): Promise<void> {
    try {
      await this.httpClient.delete(`/data/v1/projects/${projectId}/items/${itemId}`);
      this.logger.log(`Deleted item: ${itemId}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete item ${itemId}`,
        error.response?.data || error.message,
      );
      throw new BadRequestException(`Failed to delete item`);
    }
  }

  /**
   * Search for items in a project
   */
  async searchItems(projectId: string, filter: string): Promise<AutodeskItem[]> {
    try {
      const response = await this.httpClient.get(
        `/data/v1/projects/${projectId}/items`,
        {
          params: { filter },
        },
      );
      return response.data.data;
    } catch (error) {
      this.logger.error(
        `Failed to search items in project ${projectId}`,
        error.response?.data || error.message,
      );
      throw new Error('Failed to search items');
    }
  }
}