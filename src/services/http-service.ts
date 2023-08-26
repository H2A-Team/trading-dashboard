import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { message } from "antd";
import { IBaseResponse } from "../interfaces/response-interfaces";
import { COMMON_CONSTANTS } from "../constants/common-constants";
import { APP_CONSTANTS } from "../constants/app-constants";

const axiosInstance = axios.create({
    baseURL: APP_CONSTANTS.API_URL,
    headers: {
        "Content-Type": "application/json",
    },
    // withCredentials: true,
});

axiosInstance.interceptors.response.use(
    function (response) {
        return response;
    },
    function (error) {
        if (!(error instanceof AxiosError)) {
            return Promise.reject(error);
        }

        const { response } = error;
        if (!response) {
            return Promise.reject(error);
        }

        const { status } = response;

        if (status === 500) {
            const data = response.data;
            message.error(COMMON_CONSTANTS.API_MESSAGE.INTERNAL_ERROR);
            return Promise.reject(data?.errors);
        }

        return Promise.reject(error);
    }
);

export class HttpService {
    public static async get<T>(path: string, extraConfig?: AxiosRequestConfig): Promise<IBaseResponse<T>> {
        return this.handleAPIResponse(await axiosInstance.get<IBaseResponse<T>>(path, extraConfig));
    }

    public static async post<T>(
        path: string,
        payload: any,
        extraConfig?: AxiosRequestConfig
    ): Promise<IBaseResponse<T>> {
        return this.handleAPIResponse(await axiosInstance.post<IBaseResponse<T>>(path, payload, extraConfig));
    }

    public static async delete<T>(path: string, extraConfig?: AxiosRequestConfig): Promise<IBaseResponse<T>> {
        return this.handleAPIResponse(await axiosInstance.delete<IBaseResponse<T>>(path, extraConfig));
    }

    public static async put<T>(
        path: string,
        payload: any,
        extraConfig?: AxiosRequestConfig
    ): Promise<IBaseResponse<T>> {
        return this.handleAPIResponse(await axiosInstance.put<IBaseResponse<T>>(path, payload, extraConfig));
    }

    public static async patch<T>(
        path: string,
        payload: any,
        extraConfig?: AxiosRequestConfig
    ): Promise<IBaseResponse<T>> {
        return this.handleAPIResponse(await axiosInstance.patch<IBaseResponse<T>>(path, payload, extraConfig));
    }

    private static handleAPIResponse(response: AxiosResponse<any>): any {
        return response.data;
    }
}

export { axiosInstance };
