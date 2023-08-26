import { message } from "antd";
import { MessageInstance } from "antd/es/message/interface";
import { createContext, useContext } from "react";

const AntMessage = createContext<MessageInstance | undefined>(undefined);

export const AntMessageProvider = ({ children }: { children: JSX.Element }) => {
    const [messageApi, contextHolder] = message.useMessage();

    return (
        <AntMessage.Provider value={messageApi}>
            {children}
            {contextHolder}
        </AntMessage.Provider>
    );
};

export const useAntMessage = () => {
    const antMessageContext = useContext(AntMessage);

    if (antMessageContext === undefined) {
        throw new Error("useAntMessage must be used within a AntMessageProvider");
    }

    return antMessageContext;
};
