import { createPortal } from "react-dom";
import "./index.scss";

export const OverlayBlockUI = ({ children, isTransparent }: { children?: JSX.Element; isTransparent?: boolean }) => {
    return createPortal(
        <div className="overlay-block-ui">
            {createPortal(
                <div
                    className={`overlay-block-ui-backdrop${
                        isTransparent ? " overlay-block-ui-backdrop--transparent" : ""
                    }`}
                ></div>,
                document.body
            )}
            {children}
        </div>,
        document.body
    );
};
