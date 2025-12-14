import { ModuleMetadata, Type } from '@nestjs/common';

export interface AutodeskAccModuleOptions {
  clientId: string;
  clientSecret: string;
  callbackUrl?: string;
  scopes?: string[];
  isGlobal?: boolean;
  baseUrl?: string;
}

export interface AutodeskAccOptionsFactory {
  createAutodeskAccOptions(): Promise<AutodeskAccModuleOptions> | AutodeskAccModuleOptions;
}

export interface AutodeskAccModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<AutodeskAccOptionsFactory>;
  useClass?: Type<AutodeskAccOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<AutodeskAccModuleOptions> | AutodeskAccModuleOptions;
  inject?: any[];
  isGlobal?: boolean;
}