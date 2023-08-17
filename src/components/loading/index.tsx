import "./index.scss";

export interface ILoadingProps {
    message?: string;
    color?: string;
}

export function Loading(props: ILoadingProps) {
    const { message, color } = props;

    return (
        <div className="loading-container">
            <div className="loading-container__app-logo-container">
                <img
                    className="loading-container__app-logo-container__app-logo"
                    src="/images/h2a-logo.png"
                    alt="app-logo"
                    loading="lazy"
                />
            </div>
            {message && <p style={color && color !== "" ? { color: color } : undefined}>{message}</p>}
        </div>
    );
}
