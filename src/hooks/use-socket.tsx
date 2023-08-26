import { useCallback, useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";
import { SOCKET_ERROR_MESSAGE, SOCKET_NAMESPACE } from "../constants/socket-constants";
import { APP_CONSTANTS } from "../constants/app-constants";
import { message } from "antd";

interface IUseSocket {
    /**
     * A socket instance created by socket.io
     */
    socket: Socket | null;
    /**
     * Status indicator for the socket instance
     */
    status: SOCKET_STATUS;
    /**
     * Contains all methods that this hook provides
     */
    methods: {
        /**
         * Initialize a socket instance
         * @param namespace a namespace that will be used to connect to the socket server, undefined = default namespace
         * @returns void
         */
        initSocket: (namespace?: string) => void;
        /**
         * Close the currently opened socket
         * @returns void
         */
        closeSocket: () => void;
        /**
         * Force to reconnect to the socket server using the same namespace
         * @returns void
         */
        forceReconnect: () => void;
    };
}

// define all available socket status
export enum SOCKET_STATUS {
    notInitialized,
    isConnecting,
    isConnected,
    isClosed,
    isRetrying,
    maxRetryingAttempt,
}

// max reconnecting attempt
const MAX_RETRY_CONNECT = 3;

// default state's values
const defaultStates = {
    socket: null,
    ticket: null,
    namespace: "",
    retryNo: 0,
    socketStatus: SOCKET_STATUS.notInitialized,
};

// notification messages
const HOOK_MESSAGE = {
    CANNOT_CONNECT: "Cannot establish socket connection. Reload to try again.",
};

export default function useSocket(): IUseSocket {
    // states
    const [socket, setSocket] = useState<Socket | null>(defaultStates.socket);
    const [namespace, setNamespace] = useState(defaultStates.namespace);
    const [retryNo, setRetryNo] = useState<number>(defaultStates.retryNo);
    const [socketStatus, setSocketStatus] = useState<SOCKET_STATUS>(defaultStates.socketStatus);

    // memorized functions
    const initConnectSocket = useCallback(() => {
        setSocketStatus(SOCKET_STATUS.isConnecting);
        setRetryNo(defaultStates.retryNo);
    }, []);

    // effects
    useEffect(() => {
        if (!socket) return;
        socket.on("connect", () => {
            // determine socket state
            setSocketStatus(SOCKET_STATUS.isConnected);
            console.log("Socket opened");
        });

        socket.on("connect_error", (error) => {
            if (error.message === SOCKET_ERROR_MESSAGE.handshake_error) {
                setRetryNo((prev) => prev + 1);
            }
        });

        return () => {
            socket?.close();
            console.log("Socket cleaned up");
        };
    }, [socket]);

    useEffect(() => {
        const newSocket = io(APP_CONSTANTS.SOCKET_DOMAIN + namespace, {
            path: "/socket/socket.io",
            transports: ["websocket"],
        });

        setSocket((oldSocket) => {
            oldSocket?.close();

            return newSocket;
        });
    }, [namespace]);

    useEffect(() => {
        if (retryNo === 0) return;
        if (retryNo >= MAX_RETRY_CONNECT) {
            message.destroy();
            message.error(HOOK_MESSAGE.CANNOT_CONNECT, 0);
            return;
        }
    }, [retryNo]);

    // handling functions
    const createSocket = useCallback(
        (namespace: string = SOCKET_NAMESPACE.default) => {
            setNamespace(namespace);
            initConnectSocket();
        },
        [initConnectSocket]
    );

    const closeSocket = useCallback(() => {
        socket?.close();
        setSocketStatus(SOCKET_STATUS.isClosed);
    }, [socket]);

    const forceReconnect = useCallback(() => {
        initConnectSocket();
    }, [initConnectSocket]);

    // determine socket state
    if (retryNo < MAX_RETRY_CONNECT && retryNo > 0 && socketStatus !== SOCKET_STATUS.isRetrying) {
        setSocketStatus(SOCKET_STATUS.isRetrying);
    }

    if (retryNo >= MAX_RETRY_CONNECT && socketStatus !== SOCKET_STATUS.maxRetryingAttempt) {
        setSocketStatus(SOCKET_STATUS.maxRetryingAttempt);
    }

    return {
        socket: socket,
        status: socketStatus,
        methods: {
            initSocket: createSocket,
            closeSocket: closeSocket,
            forceReconnect: forceReconnect,
        },
    };
}
