export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    data: {
        token: string;
        user: {
            username: string;
            isAdmin: boolean;
        };
    };
}

export interface User {
    username: string;
    isAdmin: boolean;
}