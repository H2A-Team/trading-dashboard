import { Outlet } from "react-router-dom";
import "./index.scss";

export default function FullscreenLayout({ scrollable }: { scrollable?: boolean }) {
    return (
        <div
            className={`fullscreen-layout__scroll-wrapper${
                scrollable ? " fullscreen-layout__scroll-wrapper--scrollable" : ""
            }`}
        >
            <main className="fullscreen-layout__main">
                <Outlet />
            </main>
        </div>
    );
}
