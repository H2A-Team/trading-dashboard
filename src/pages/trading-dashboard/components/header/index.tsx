import { Button, Dropdown, MenuProps } from "antd";
import { Link } from "react-router-dom";
import AppLogo from "../../../../components/app-logo";
import { navigation } from "../../../../constants/navigation";
import { useQuery } from "../../../../hooks/use-query";
import { DownOutlined, MenuOutlined } from "@ant-design/icons";
import "./index.scss";

interface ITradingDashboardHeaderProps {
    showDrawerToggle: boolean;
    openDrawer: () => void;
}

export default function Header(props: ITradingDashboardHeaderProps) {
    const { showDrawerToggle, openDrawer } = props;
    const { isMatching: isSmallScreen } = useQuery("(max-width: 768px)");

    const dropdownItems: MenuProps["items"] = navigation.map((nav, index) => ({
        key: index,
        label: <Link to={nav.path}>{nav.label}</Link>,
    }));

    return (
        <>
            <header className="trading-dashboard__header">
                {isSmallScreen ? (
                    <Dropdown menu={{ items: dropdownItems }} trigger={["click"]}>
                        <nav onClick={(e) => e.preventDefault()} style={{ height: "100%" }}>
                            <div style={{ display: "flex", height: "100%", cursor: "pointer" }}>
                                <div style={{ height: "100%" }}>
                                    <AppLogo />
                                </div>
                                <DownOutlined />
                            </div>
                        </nav>
                    </Dropdown>
                ) : (
                    <Link to="/" style={{ height: "100%" }}>
                        <AppLogo />
                    </Link>
                )}

                <div className="trading-dashboard__header__middle"></div>

                <div className="trading-dashboard__header__right">
                    {showDrawerToggle ? (
                        <Button type="text" onClick={() => openDrawer && openDrawer()}>
                            <MenuOutlined />
                        </Button>
                    ) : null}
                </div>
            </header>
        </>
    );
}
