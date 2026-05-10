export interface VirtualServer {
    id: string;
    type: number;
    owner: string;
    isVST: boolean;
    name: string;
    description: string;
    softStatus: string;
    hardStatus: string | null;
    host: string | null;
    cost: number;
    baseCost: number;
    dtr: number;
    disabled?: boolean;
    folderName: string;
}

export interface NetworkConfig {
    name: string;
    ipv4: string | null;
    ipv6: string | null;
    mac: string | null;
}

export interface CustomAccess {
    id: number;
    description: string;
    password: string | null;
    enabled: boolean;
    canChangePassword: boolean;
    changeDescription: string | null;
}

export interface VirtualServerExtended extends VirtualServer {
    typeDescription: string;
    fixedHost: string | null;
    preferredHosts: string[];
    requisites: string[];
    networkConfigs: NetworkConfig[];
    customAccesses: CustomAccess[];
    ipVnet1: string | null;
    ipv6Vnet1: string | null;
    macVnet1: string | null;
}

export interface VSListResponse {
    success: boolean;
    data: VirtualServer[];
}

export interface VSDetailsResponse {
    success: boolean;
    data: VirtualServerExtended;  
}