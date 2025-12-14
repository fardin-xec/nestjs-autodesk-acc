import { DynamicModule, Module, Provider } from '@nestjs/common';
import { AutodeskAccService } from './services/autodesk-acc.service';
import { AutodeskAuthService } from './services/autodesk-auth.service';
import { AutodeskDataManagementService } from './services/autodesk-data-management.service';
import { AutodeskProjectService } from './services/autodesk-project.service';
import { AUTODESK_ACC_OPTIONS } from './constants';
import { AutodeskAccModuleOptions, AutodeskAccModuleAsyncOptions } from './interfaces';

@Module({})
export class AutodeskAccModule {
  static forRoot(options: AutodeskAccModuleOptions): DynamicModule {
    return {
      module: AutodeskAccModule,
      providers: [
        {
          provide: AUTODESK_ACC_OPTIONS,
          useValue: options,
        },
        AutodeskAuthService,
        AutodeskDataManagementService,
        AutodeskProjectService,
        AutodeskAccService,
      ],
      exports: [AutodeskAccService],
      global: options.isGlobal ?? false,
    };
  }

  static forRootAsync(options: AutodeskAccModuleAsyncOptions): DynamicModule {
    return {
      module: AutodeskAccModule,
      imports: options.imports || [],
      providers: [
        ...this.createAsyncProviders(options),
        AutodeskAuthService,
        AutodeskDataManagementService,
        AutodeskProjectService,
        AutodeskAccService,
      ],
      exports: [AutodeskAccService],
      global: options.isGlobal ?? false,
    };
  }

  private static createAsyncProviders(options: AutodeskAccModuleAsyncOptions): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: AUTODESK_ACC_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      ];
    }

    return [
      {
        provide: AUTODESK_ACC_OPTIONS,
        useFactory: async (optionsFactory: any) =>
          await optionsFactory.createAutodeskAccOptions(),
        inject: [options.useExisting || options.useClass] as any,
      },
    ];
  }
}