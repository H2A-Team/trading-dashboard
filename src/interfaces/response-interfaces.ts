export interface IBaseResponse<T> {
    data?: T;
    total?: number;
    offset?: number;
    limit?: number;
    detail?: any;
}
