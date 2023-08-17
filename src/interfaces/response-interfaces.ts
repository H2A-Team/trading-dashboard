export interface IBaseResponse<T> {
    code: number;
    message: string;
    data?: T;
    errors?: any;
}
