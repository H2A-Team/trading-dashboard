import { RouteObject, Navigate } from "react-router-dom";
import AppFrame from "../components/app-frame";
import NotFound from "../components/error-pages/not-found";
import Forbidden from "../components/error-pages/forbidden";
import FullscreenLayout from "../layouts/fullscreen-layout";
import TradingDashboard from "../pages/trading-dashboard";

export const routes: RouteObject[] = [
    {
        path: "/",
        element: <AppFrame layout={<FullscreenLayout />} />,
        children: [
            {
                path: "",
                element: <TradingDashboard />,
            },
            // Do not change below segment
            {
                path: "404",
                element: <NotFound />,
            },
            {
                path: "403",
                element: <Forbidden />,
            },
        ],
    },
    {
        path: "*",
        element: <Navigate to="/404" replace={true} />,
    },
];
