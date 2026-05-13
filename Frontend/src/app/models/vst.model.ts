export interface VirtualServerTemplate {
    id: string;
    type: number;
    owner: string;
    name: string;
    description: string;
    html: string;
    cost: number;
    disabled: boolean;
    softStatus: string;
    typeDescription: string;
    requisites: string[];
    fixedHost: string | null;
    folderName: string;
}

export interface VSTListResponse {
    success: boolean;
    data: VirtualServerTemplate[];
}

export interface VSTDetailsResponse {
    success: boolean;
    data: VirtualServerTemplate;
}