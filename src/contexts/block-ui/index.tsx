import { createContext, useContext, useState } from "react";
import { Space } from "antd";
import { OverlayBlockUI } from "./components/overlay";
import { Loading } from "../../components/loading";

export interface IBlockUIState {
    isBlocking: boolean;
    blockMessage: string;
    isTransparent: boolean;
}

export interface IBlockUI {
    state: IBlockUIState;
    blockUI: (msg?: string, isTransparent?: boolean) => void;
    unblockUI: () => void;
}

// define default value
const initialGlobalState = {
    isBlocking: false,
    blockMessage: "Processing, please wait ...",
    isTransparent: false,
};

const BlockUI = createContext<IBlockUI>({
    state: initialGlobalState,
    blockUI: () => {},
    unblockUI: () => {},
});

export const BlockUIProvider = ({ children }: { children: JSX.Element }) => {
    const [globalState, setGlobalState] = useState<IBlockUIState>(initialGlobalState);

    const blockUI = (msg?: string, isTransparent: boolean = false) => {
        setGlobalState({
            ...globalState,
            blockMessage: msg || initialGlobalState.blockMessage,
            isBlocking: true,
            isTransparent: isTransparent,
        });
    };

    const unblockUI = () => {
        setGlobalState({
            ...globalState,
            blockMessage: initialGlobalState.blockMessage,
            isBlocking: false,
            isTransparent: false,
        });
    };

    return (
        <BlockUI.Provider value={{ state: globalState, blockUI, unblockUI }}>
            {children}
            {globalState.isBlocking && (
                <OverlayBlockUI isTransparent={globalState.isTransparent}>
                    <Space
                        direction="vertical"
                        style={{ width: "100vw", height: "100vh", alignItems: "center", justifyContent: "center" }}
                    >
                        {globalState.isTransparent ? null : <Loading message={globalState.blockMessage} />}
                    </Space>
                </OverlayBlockUI>
            )}
        </BlockUI.Provider>
    );
};

export const useBlockUI = () => {
    const blockUIContext = useContext(BlockUI);

    if (blockUIContext === undefined) {
        throw new Error("useBlockUI must be used within a BlockUIProvider");
    }

    return blockUIContext;
};
