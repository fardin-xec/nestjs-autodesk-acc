export interface AutodeskFolder {
  id: string;
  type: string;
  attributes: {
    name: string;
    displayName: string;
    createTime: string;
    createUserId: string;
    lastModifiedTime: string;
    lastModifiedUserId: string;
    objectCount: number;
    hidden: boolean;
    extension?: {
      type: string;
      version: string;
      data?: any;
    };
  };
}

export interface AutodeskItem {
  id: string;
  type: string;
  attributes: {
    name: string;
    displayName: string;
    createTime: string;
    createUserId: string;
    lastModifiedTime: string;
    lastModifiedUserId: string;
    fileType: string;
    extension?: {
      type: string;
      version: string;
      data?: any;
    };
  };
}

export interface UploadFileOptions {
  fileName: string;
  folderId: string;
  projectId: string;
  fileBuffer: Buffer;
  contentType?: string;
}

export interface AutodeskStorageLocation {
  type: string;
  id: string;
  objectKey: string;
  size: number;
  location: string;
}