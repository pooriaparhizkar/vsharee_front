export interface __Pagination<T> {
    data: T[];
    pageSize: number;
    page: number;
    totalPages: number;
    totalCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

export interface __Response<T> {
    value: __ValueResponse<T>;
    status: number;
}

export interface __ValueResponse<T> {
    value: T;
    status: number;
    isSuccess?: boolean;
    message?: string;
    errors?: any;
}
