import { Button } from "antd";
import { useNavigate } from "react-router-dom";

export default function Forbidden() {
    const navigate = useNavigate();

    return (
        <div
            className="single-column-layout__main__item--grow"
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                gap: "1rem",
                marginBlock: "1rem",
            }}
        >
            <div style={{ height: "30vh" }}>
                <img src="/svg/undraw_notify.svg" alt="page-not-found" style={{ width: "100%", height: "100%" }} />
            </div>

            <h3>You do not have access to this page</h3>

            <Button type="primary" onClick={() => navigate("/")}>
                Back to home
            </Button>
        </div>
    );
}
