export const SOCKET_ERROR_MESSAGE = {
    handshake_error: "invalid_or_expires_ticket",
};

export const SOCKET_NAMESPACE = {
    default: "",
    presentation: "/presentation",
};

export const SOCKET_LISTEN_EVENT = {
    present: "present",
    change_slide: "change_slide",
    quit_slide: "quit",
    audience_vote: "audience_vote",
};

export const SOCKET_EMIT_EVENT = {
    join_room: "join-room",
    leave_room: "leave-room",
};
