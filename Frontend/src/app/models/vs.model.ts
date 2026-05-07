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

export interface VSListResponse {
    success: boolean;
    data: VirtualServer[];
}

export interface VSDetailsResponse {
    success: boolean;
    data: VirtualServer;
}