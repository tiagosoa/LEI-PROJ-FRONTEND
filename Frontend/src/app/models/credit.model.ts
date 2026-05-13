export interface CreditInfo {
    total: number;
    used: number;
    available: number;
}

export interface CreditResponse {
    success: boolean;
    data: CreditInfo;
}