import { LoadingOutlined } from "@ant-design/icons";
import { Space, theme } from "antd";
import "./index.scss";

interface IFetchingIndicatorProps {
    message?: string;
    loading?: boolean;
    canSeeThrough?: boolean;
    loadingIconSize?: number;
}

/**
 * Automatically fills the nearest element that has position attribute set to relative
 */
export default function FetchingIndicator(props: IFetchingIndicatorProps) {
    const { loading, message, canSeeThrough, loadingIconSize } = props;
    const { token } = theme.useToken();

    return loading ? (
        <div
            className={`trading-view-chart__fetching-indicator__backdrop${
                canSeeThrough ? " trading-view-chart__fetching-indicator__backdrop--see-through" : ""
            }`}
        >
            <div className="fetching-indicator__icon">
                <Space direction="vertical" style={{ color: token.colorPrimary, alignItems: "center" }} size="middle">
                    <LoadingOutlined style={{ fontSize: loadingIconSize || 40 }} />
                    {message || "Fetching data ..."}
                </Space>
            </div>
        </div>
    ) : null;
}
