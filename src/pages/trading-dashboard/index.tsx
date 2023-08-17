import "./index.scss";
import Header from "./components/header";
import TradingViewChart from "./components/trading-view-chart";
import { Col, Row, Segmented, Space, Input, Button, Empty, Typography, theme, Dropdown, Drawer } from "antd";
import { useState } from "react";
import { GoldOutlined, RightOutlined } from "@ant-design/icons";
import { useQuery } from "../../hooks/use-query";

const TIMEFRAME_OPTIONS = {
    "1D": 0,
    "5D": 1,
    "1M": 2,
    "3M": 3,
    "6M": 4,
    YTD: 5,
    "1Y": 6,
    "5Y": 7,
    All: 8,
};

type TIMEFRAME_OPTION = keyof typeof TIMEFRAME_OPTIONS;

interface ISymbol {
    name: string;
    marketValue: number;
}

const defaultSelectSymbol: ISymbol = {
    name: "",
    marketValue: 0,
};

export default function TradingDashboard() {
    const { token } = theme.useToken();
    const { isMatching: isSmallScreen } = useQuery("(max-width: 1000px)");
    const { isMatching: hideRightSidebar } = useQuery("(max-width: 768px)");

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [timeframe, setTimeframe] = useState<TIMEFRAME_OPTION>("All");
    const [symbolsList, setSymbolsList] = useState<string[]>([
        "BTCUSD",
        "BTCUSDT",
        "BTCUSDC",
        "ETHUSD",
        "ETHUSDT",
        "ETHUSDC",
    ]);
    const [symbolSearch, setSymbolSearch] = useState<string>("");
    const [selectedSymbol, setSelectedSymbol] = useState<ISymbol>(defaultSelectSymbol);

    // handlers
    const handleSearchSymbol: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const searchStr = e.target.value.trim().toUpperCase();

        setSymbolSearch(searchStr);
    };

    const handleSelectSymbol = (symbol: string) => {
        setSelectedSymbol((val) => ({ ...val, name: symbol }));
        setSymbolSearch("");
    };

    const handlePredictNextTimeFrame = () => {
        console.log("Clicked the predict next timeframe button");
    };

    // process data
    const filteredSymbolsList = symbolsList.filter((symbol) => symbol.indexOf(symbolSearch) > -1);

    // render functions
    const renderRightSidebar = () => {
        return (
            <div className="trading-dashboard__right-sidebar trading-dashboard__contents-block">
                <div className="right-sidebar__component right-sidebar__component--above">
                    <div className="component__stack">
                        <h3 style={{ margin: 0 }}>Watchlist</h3>

                        <Input.Search
                            placeholder="Enter a symbol name"
                            value={symbolSearch}
                            onChange={handleSearchSymbol}
                        />

                        <div style={{ flexGrow: 1, overflowY: "auto" }}>
                            <Space direction="vertical" style={{ width: "100%" }} size="small">
                                {filteredSymbolsList.map((symbol) => (
                                    <Button
                                        type={symbol === selectedSymbol.name ? "primary" : "text"}
                                        key={symbol}
                                        block
                                        style={{ textAlign: "left" }}
                                        onClick={() => handleSelectSymbol(symbol)}
                                    >
                                        <Space size="middle">
                                            <GoldOutlined />
                                            {symbol}
                                        </Space>
                                    </Button>
                                ))}
                            </Space>
                        </div>
                    </div>
                </div>

                <div className="right-sidebar__component right-sidebar__component--divider"></div>

                <div className="right-sidebar__component right-sidebar__component--below">
                    <div className="component__stack">
                        <h3 style={{ margin: 0 }}>Information</h3>

                        <div style={{ flexGrow: 1, overflowY: "auto" }}>
                            <Space direction="vertical" style={{ width: "100%" }} size="middle">
                                {selectedSymbol.name === "" ? (
                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Please choose a symbol" />
                                ) : (
                                    <>
                                        <Space direction="vertical" style={{ width: "100%" }} size={0}>
                                            <Typography.Title level={5} style={{ margin: 0 }}>
                                                {selectedSymbol.name}
                                            </Typography.Title>
                                            <Typography.Text type="secondary" style={{ margin: 0 }}>
                                                Crypto
                                            </Typography.Text>
                                        </Space>

                                        <Typography.Title level={2} style={{ margin: 0 }}>
                                            <Space size="small">
                                                {selectedSymbol.marketValue}
                                                <span>USD</span>
                                            </Space>
                                        </Typography.Title>
                                    </>
                                )}
                            </Space>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <Header showDrawerToggle={hideRightSidebar} openDrawer={() => setIsDrawerOpen(true)} />
            <div className="trading-dashboard__scroll-wrapper">
                <main className="trading-dashboard__main">
                    <Row style={{ flexGrow: "1" }} gutter={[4, 4]}>
                        <Col
                            xxl={20}
                            xl={19}
                            lg={18}
                            md={17}
                            sm={24}
                            xs={24}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 4,
                            }}
                        >
                            <div className="trading-dashboard__main__item--grow trading-dashboard__contents-block">
                                <TradingViewChart symbol={selectedSymbol.name} />
                            </div>
                            <div className="trading-dashboard__contents-block trading-dashboard__chart-options">
                                <div className="trading-dashboard__chart-options__left">
                                    <h4 style={{ margin: 0 }}>Timeframe</h4>

                                    {isSmallScreen ? (
                                        <Dropdown
                                            menu={{
                                                items: Object.keys(TIMEFRAME_OPTIONS).map((option) => ({
                                                    key: option,
                                                    label: option,
                                                })),
                                                selectable: true,
                                                selectedKeys: [timeframe],
                                                onClick: (e) => setTimeframe(e.key as TIMEFRAME_OPTION),
                                            }}
                                            trigger={["click"]}
                                        >
                                            <Button onClick={(e) => e.preventDefault()} style={{ height: "100%" }}>
                                                {timeframe}
                                            </Button>
                                        </Dropdown>
                                    ) : (
                                        <Segmented
                                            options={Object.keys(TIMEFRAME_OPTIONS)}
                                            value={timeframe}
                                            onChange={(value) => setTimeframe(value as TIMEFRAME_OPTION)}
                                        />
                                    )}
                                </div>

                                <div className="trading-dashboard__chart-options__right">
                                    <Button type="text" onClick={handlePredictNextTimeFrame}>
                                        <Space>
                                            <h4 style={{ margin: 0, color: token.colorPrimary }}>
                                                Predict Next Timeframe
                                            </h4>
                                            <RightOutlined style={{ color: token.colorPrimary }} />
                                        </Space>
                                    </Button>
                                </div>
                            </div>
                        </Col>
                        {!hideRightSidebar && (
                            <Col xxl={4} xl={5} lg={6} md={7} sm={24} xs={24}>
                                {renderRightSidebar()}
                            </Col>
                        )}

                        {hideRightSidebar && (
                            <Drawer placement="right" onClose={() => setIsDrawerOpen(false)} open={isDrawerOpen}>
                                {renderRightSidebar()}
                            </Drawer>
                        )}
                    </Row>
                </main>
            </div>
        </>
    );
}
