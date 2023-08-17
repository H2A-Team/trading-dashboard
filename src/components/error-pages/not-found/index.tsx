import { Button } from "antd";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
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
                <img
                    src="/svg/undraw_page_not_found.svg"
                    alt="page-not-found"
                    style={{ width: "100%", height: "100%" }}
                />
            </div>

            <h3>The requested page does not exist</h3>

            <Button type="primary" onClick={() => navigate("/")}>
                Back to home
            </Button>
        </div>
    );
}
