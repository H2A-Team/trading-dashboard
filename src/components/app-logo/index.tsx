import "./index.scss";

export default function AppLogo({ width, height }: { width?: string; height?: string }) {
    let style: React.HTMLAttributes<HTMLDivElement> | undefined;

    if (width || height || width !== "" || height !== "") {
        style = { width: width, height: height } as React.HTMLAttributes<HTMLDivElement>;
    }

    return (
        <div className="app-logo" style={style}>
            <div className="app-logo__img-wrapper">
                <img src="/images/h2a-logo.png" alt="h2a-logo" />
            </div>

            <span>Trading Dashboard</span>
        </div>
    );
}
