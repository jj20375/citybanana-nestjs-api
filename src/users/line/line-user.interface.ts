export interface ILineUser {
    name?: string;
    user_id?: number | null | string;
    midori_id?: string;
    status?: number;
    picture?: string;
    status_message?: string | null;
    last_login_at?: Date;
}
