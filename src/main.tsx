import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import { StyleProvider } from "@ant-design/cssinjs";
import { routes } from "./constants/routes";
import "./assets/index.scss";
import { customizedTheme } from "./constants/theme";
import { BlockUIProvider } from "./contexts/block-ui";

const router = createBrowserRouter(routes);

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <StyleProvider hashPriority="high">
            <ConfigProvider theme={customizedTheme}>
                <BlockUIProvider>
                    <RouterProvider router={router} />
                </BlockUIProvider>
            </ConfigProvider>
        </StyleProvider>
    </React.StrictMode>
);
