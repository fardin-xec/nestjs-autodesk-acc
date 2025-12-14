# NestJS Autodesk Construction Cloud (ACC) Library

A comprehensive NestJS library for integrating with Autodesk Construction Cloud APIs, providing authentication, project management, and file operations.

## Features

- ✅ OAuth 2.0 Authentication (2-legged and 3-legged)
- ✅ Hub and Project Management
- ✅ File Upload and Download
- ✅ Folder Management
- ✅ Data Management API Integration
- ✅ TypeScript Support
- ✅ Fully Typed Interfaces
- ✅ Automatic Token Refresh
- ✅ Modular Architecture

## Installation

```bash
npm install @yourcompany/nestjs-autodesk-acc
```

## Quick Start

### 1. Register the Module

```typescript
import { Module } from '@nestjs/common';
import { AutodeskAccModule } from '@yourcompany/nestjs-autodesk-acc';

@Module({
  imports: [
    AutodeskAccModule.forRoot({
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
      scopes: ['data:read', 'data:write', 'data:create'],
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
```

### 2. Use in Your Service

```typescript
import { Injectable } from '@nestjs/common';
import { AutodeskAccService } from '@yourcompany/nestjs-autodesk-acc';

@Injectable()
export class MyService {
  constructor(private readonly autodeskService: AutodeskAccService) {}

  async uploadFile(file: Buffer) {
    return this.autodeskService.uploadFile(
      'project-id',
      'folder-id',
      'filename.pdf',
      file
    );
  }
}
```

## Configuration

### Synchronous Configuration

```typescript
AutodeskAccModule.forRoot({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  callbackUrl: 'http://localhost:3000/auth/callback',
  scopes: ['data:read', 'data:write', 'data:create'],
  isGlobal: true,
})
```

### Async Configuration with ConfigService

```typescript
AutodeskAccModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    clientId: configService.get('AUTODESK_CLIENT_ID'),
    clientSecret: configService.get('AUTODESK_CLIENT_SECRET'),
    callbackUrl: configService.get('AUTODESK_CALLBACK_URL'),
    scopes: ['data:read', 'data:write', 'data:create'],
    isGlobal: true,
  }),
  inject: [ConfigService],
})
```

## Available Scopes

- `data:read` - Read data
- `data:write` - Write data
- `data:create` - Create data
- `data:search` - Search data
- `bucket:read` - Read buckets
- `bucket:create` - Create buckets
- `bucket:delete` - Delete buckets

## API Documentation

### AutodeskAccService

Main service providing access to all functionality.

#### Properties

- `auth: AutodeskAuthService` - Authentication operations
- `projects: AutodeskProjectService` - Project management
- `dataManagement: AutodeskDataManagementService` - File and folder operations

#### Quick Methods

```typescript
// Get all hubs
const hubs = await autodeskService.getHubs();

// Get projects for a hub
const projects = await autodeskService.getProjects(hubId);

// Upload a file
const item = await autodeskService.uploadFile(
  projectId,
  folderId,
  'document.pdf',
  fileBuffer
);

// Get folder contents
const contents = await autodeskService.getFolderContents(projectId, folderId);

// Create a folder
const folder = await autodeskService.createFolder(
  projectId,
  parentFolderId,
  'New Folder'
);

// Delete an item
await autodeskService.deleteItem(projectId, itemId);
```

### AutodeskAuthService

Handles OAuth authentication.

```typescript
// Get access token (auto-refresh)
const token = await authService.getAccessToken();

// Get authorization URL for 3-legged OAuth
const url = authService.getAuthorizationUrl('state-value');

// Exchange code for token
const context = await authService.getAccessTokenFromCode(code);

// Refresh token
const newContext = await authService.refreshAccessToken(refreshToken);
```

### AutodeskProjectService

Manages hubs and projects.

```typescript
// Get all hubs
const hubs = await projectService.getHubs();

// Get specific hub
const hub = await projectService.getHub(hubId);

// Get projects in hub
const projects = await projectService.getProjects(hubId);

// Get specific project
const project = await projectService.getProject(hubId, projectId);

// Get top folders
const folders = await projectService.getProjectTopFolders(hubId, projectId);
```

### AutodeskDataManagementService

Handles files and folders.

```typescript
// Get folder contents
const contents = await dataService.getFolderContents(projectId, folderId);

// Get folder details
const folder = await dataService.getFolder(projectId, folderId);

// Create folder
const newFolder = await dataService.createFolder(
  projectId,
  parentFolderId,
  'Folder Name'
);

// Upload file
const item = await dataService.uploadFile({
  projectId: 'project-id',
  folderId: 'folder-id',
  fileName: 'document.pdf',
  fileBuffer: buffer,
  contentType: 'application/pdf',
});

// Get item details
const item = await dataService.getItem(projectId, itemId);

// Delete item
await dataService.deleteItem(projectId, itemId);

// Search items
const items = await dataService.searchItems(projectId, 'filter-query');
```

## Complete Example

```typescript
import { Controller, Post, Get, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AutodeskAccService } from '@yourcompany/nestjs-autodesk-acc';

@Controller('autodesk')
export class AutodeskController {
  constructor(private readonly autodeskService: AutodeskAccService) {}

  @Get('structure')
  async getProjectStructure() {
    // Get all hubs
    const hubs = await this.autodeskService.getHubs();
    
    const structure = [];
    
    for (const hub of hubs) {
      const projects = await this.autodeskService.getProjects(hub.id);
      
      for (const project of projects) {
        const folders = await this.autodeskService.projects
          .getProjectTopFolders(hub.id, project.id);
        
        structure.push({
          hub: hub.attributes.name,
          project: project.name,
          folders: folders.map(f => f.attributes.name),
        });
      }
    }
    
    return structure;
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
  ) {
    const projectId = 'your-project-id';
    const folderId = 'your-folder-id';
    
    const result = await this.autodeskService.uploadFile(
      projectId,
      folderId,
      file.originalname,
      file.buffer,
      file.mimetype,
    );
    
    return {
      success: true,
      itemId: result.id,
      fileName: result.attributes.displayName,
    };
  }
}
```

## Error Handling

The library throws standard NestJS exceptions:

- `UnauthorizedException` - Authentication failures
- `NotFoundException` - Resource not found
- `BadRequestException` - Invalid requests
- `Error` - General errors

```typescript
try {
  await autodeskService.uploadFile(...);
} catch (error) {
  if (error instanceof UnauthorizedException) {
    // Handle auth error
  }
}
```

## Best Practices

1. **Use Global Module**: Set `isGlobal: true` to avoid re-importing
2. **Environment Variables**: Store credentials in environment variables
3. **Error Handling**: Always wrap API calls in try-catch blocks
4. **Token Management**: The library handles token refresh automatically
5. **File Uploads**: Use streams for large files when possible

## Requirements

- NestJS 10.x or higher
- Node.js 18.x or higher
- Valid Autodesk Forge/ACC application credentials

## Getting Autodesk Credentials

1. Go to [Autodesk Forge Portal](https://forge.autodesk.com)
2. Create a new application
3. Get your Client ID and Client Secret
4. Configure callback URL for 3-legged OAuth

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

## Contributing

Contributions are welcome! Please read our contributing guidelines.