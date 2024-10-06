export interface IverifyCode {
    phone: string;
    retryRemaining: number;
    authenticated: boolean;
    code: string | number;
    updatedAt?: string;
    createdAt: string;
    expiredAt: string;
}
