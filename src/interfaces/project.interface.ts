export interface AutodeskProject {
  id: string;
  name: string;
  accountId: string;
  status: string;
  jobNumber?: string;
  addressLine1?: string;
  city?: string;
  stateOrProvince?: string;
  postalCode?: string;
  country?: string;
  startDate?: string;
  endDate?: string;
}

export interface AutodeskHub {
  id: string;
  type: string;
  attributes: {
    name: string;
    region: string;
    extension?: {
      type: string;
      version: string;
      data?: any;
    };
  };
}
