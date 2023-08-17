export const COMMON_CONSTANTS = {
    API_MESSAGE: {
        INTERNAL_ERROR: "Đã có lỗi trong quá trình xử lý, vui lòng liên hệ admin",
    },
    pagination: {
        limit: 10,
        defaultPage: 1,
        defaultTotal: 0,
    },
};

export const RESPONSE_CODE = {
    // 400: BAD REQUEST

    // 401: UNAUTHORIZED
    LOGIN_EXPIRED: 4011,

    // 403: FORBIDDEN
};

export const SUCCESS_NOTIFICATION = {};

export const ERROR_NOTIFICATION = {};

export const PRESENTATION_OWNER_TYPE = {
    OWNER: "owner",
    COLLABORATOR: "collaborator",
};

export const PRESENTATION_DATE_TYPE = {
    ASC: "ASC",
    DESC: "DESC",
};
