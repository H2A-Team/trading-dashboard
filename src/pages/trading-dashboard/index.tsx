import Header from "./components/header";
import { useEffect, useState } from "react";
import TradingViewChart, { IPredictedData, IPredictedLine } from "./components/trading-view-chart";
import {
    Col,
    Row,
    Segmented,
    Space,
    Input,
    Button,
    Empty,
    Typography,
    theme,
    Dropdown,
    Drawer,
    MenuProps,
    Popconfirm,
} from "antd";
import { CloseOutlined, GoldOutlined, RightOutlined, SettingOutlined, SwapOutlined } from "@ant-design/icons";
import { useQuery } from "../../hooks/use-query";
import PredictOptionModal, { IPredictOptionForm, IPredictOptionModalOptions } from "./components/predict-option-modal";
import "./index.scss";
import { CandlestickData } from "lightweight-charts";
import { HttpService } from "../../services/http-service";
import { useBlockUI } from "../../contexts/block-ui";
import { useAntMessage } from "../../contexts/ant-message";

export interface ITimeframe {
    period: string;
    interval: string;
}

export const TIMEFRAME_OPTIONS: { [key: string]: ITimeframe } = {
    "1D": {
        period: "1D",
        interval: "1m",
    },
    "5D": {
        period: "5D",
        interval: "5m",
    },
    "1M": {
        period: "1M",
        interval: "30m",
    },
    "3M": {
        period: "3M",
        interval: "1h",
    },
    "6M": {
        period: "6M",
        interval: "2h",
    },
};

export type TIMEFRAME_OPTION = keyof typeof TIMEFRAME_OPTIONS;

// option format: (name: { key, label })
const PREDICT_OPTIONS = {
    candle: {
        key: "candle",
        label: "Next candle",
    },
    timeframe: {
        key: "timeframe",
        label: "Next timeframe",
    },
};

export interface ISymbol {
    symbol: string;
    status: string;
    baseAsset: string;
    baseAssetPrecision: number;
    quoteAsset: string;
    quotePrecision: number;
    quoteAssetPrecision: number;
    baseCommissionPrecision: number;
    quoteCommissionPrecision: number;
}

export type TRADING_DASHBOARD_MODE = "normal" | "predict-candle" | "predict-timeframe";

const defaultPredictOptionModalOptions: IPredictOptionModalOptions = {
    modelsList: [
        {
            key: "xgboost",
            label: "XGBoost",
        },
        {
            key: "rnn",
            label: "RNN",
        },
        {
            key: "lstm",
            label: "LSTM",
        },
    ],
    selectedModel: null,

    featuresList: [
        {
            key: "close",
            label: "Close price",
        },
        {
            key: "roc",
            label: "Rate of change",
        },
    ],
    selectedFeature: [],
};

const fakePredictedData: {
    predictedCandle: CandlestickData[];
    predictedLines: IPredictedLine[];
} = {
    predictedCandle: [
        {
            time: "2019-01-01",
            open: 111.26 + 200,
            high: 140.26 + 200,
            low: 70.66 + 200,
            close: 85.26 + 200,
        },
    ],
    predictedLines: [
        {
            label: "Close price",
            data: [
                {
                    time: "2019-01-01",
                    value: 85.26 + 200,
                },
                {
                    time: "2019-01-02",
                    value: 90.26 + 200,
                },
                {
                    time: "2019-01-03",
                    value: 95.26 + 200,
                },
                {
                    time: "2019-01-04",
                    value: 92.26 + 200,
                },
                {
                    time: "2019-01-05",
                    value: 100.26 + 200,
                },
                {
                    time: "2019-01-06",
                    value: 84.26 + 200,
                },
                {
                    time: "2019-01-07",
                    value: 87.26 + 200,
                },
                {
                    time: "2019-01-08",
                    value: 102.26 + 200,
                },
                {
                    time: "2019-01-09",
                    value: 101.26 + 200,
                },
                {
                    time: "2019-01-10",
                    value: 80.26 + 200,
                },
            ],
        },
        {
            label: "Rate of change",
            data: [
                {
                    time: "2019-01-01",
                    value: 20,
                },
                {
                    time: "2019-01-02",
                    value: -20,
                },
                {
                    time: "2019-01-03",
                    value: 30,
                },
                {
                    time: "2019-01-04",
                    value: 27,
                },
                {
                    time: "2019-01-05",
                    value: 22,
                },
                {
                    time: "2019-01-06",
                    value: -15,
                },
                {
                    time: "2019-01-07",
                    value: -10,
                },
                {
                    time: "2019-01-08",
                    value: 15,
                },
                {
                    time: "2019-01-09",
                    value: 17,
                },
                {
                    time: "2019-01-10",
                    value: 19,
                },
            ],
        },
    ],
};

export default function TradingDashboard() {
    const { token } = theme.useToken();
    const { isMatching: isSmallScreen } = useQuery("(max-width: 1000px)");
    const { isMatching: hideRightSidebar } = useQuery("(max-width: 768px)");
    const { blockUI, unblockUI } = useBlockUI();
    const messageApi = useAntMessage();

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [timeframe, setTimeframe] = useState<ITimeframe>(TIMEFRAME_OPTIONS["3M"]);
    const [symbolsList, setSymbolsList] = useState<ISymbol[]>([]);
    const [symbolSearch, setSymbolSearch] = useState<string>("");
    const [selectedSymbol, setSelectedSymbol] = useState<ISymbol | null>(null);
    const [mode, setMode] = useState<TRADING_DASHBOARD_MODE>("normal");
    const [openPredictOptionModal, setOpenPredictOptionModal] = useState(false);
    const [predictOptions, setPredictOptions] = useState<IPredictOptionModalOptions>(defaultPredictOptionModalOptions);
    const [predictedData, setPredictedData] = useState<IPredictedData>({});

    useEffect(() => {
        const fetch = async () => {
            blockUI();
            try {
                const res = await HttpService.get<ISymbol[]>("/v1/symbols");

                if (res.data) setSymbolsList(res.data);
            } catch (error) {
                console.error(error);
                messageApi.error("There was an error when fetching symbols list");
            }
            unblockUI();
        };

        fetch();
    }, [blockUI, unblockUI]);

    // handlers
    const handleSearchSymbol: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const searchStr = e.target.value.trim().toUpperCase();

        setSymbolSearch(searchStr);
    };

    const handleSelectSymbol = (symbol: ISymbol) => {
        setSelectedSymbol(symbol);
    };

    const handlePredictBtn: MenuProps["onClick"] = ({ key }) => {
        if (selectedSymbol === null) return;
        switch (key) {
            case PREDICT_OPTIONS.candle.key: {
                setPredictedData({
                    nextCandle: fakePredictedData.predictedCandle,
                });
                setMode("predict-candle");
                break;
            }

            case PREDICT_OPTIONS.timeframe.key: {
                setPredictOptions(defaultPredictOptionModalOptions);
                setOpenPredictOptionModal(true);
                break;
            }
        }
    };

    const handlePredictNextTimeframe = (form: IPredictOptionForm) => {
        setPredictOptions((val) => ({ ...val, selectedFeature: form.feature, selectedModel: form.model }));
        setOpenPredictOptionModal(false);
        setPredictedData({
            nextTimeframe: [
                {
                    label: fakePredictedData.predictedLines[0].label,
                    data: fakePredictedData.predictedLines[0].data,
                },
                {
                    label: fakePredictedData.predictedLines[1].label,
                    data: fakePredictedData.predictedLines[1].data,
                },
            ],
        });
        setMode("predict-timeframe");
    };

    const handleQuitPredictionMode = () => {
        setPredictedData(() => ({}));
        setMode("normal");
    };

    // process data
    const filteredSymbolsList = symbolsList.filter((symbol) => symbol.symbol.indexOf(symbolSearch) > -1);

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
                            allowClear
                        />

                        <div style={{ flexGrow: 1, overflowY: "auto" }}>
                            <Space direction="vertical" style={{ width: "100%" }} size="small">
                                {filteredSymbolsList.map((symbol) => (
                                    <Button
                                        type={
                                            selectedSymbol && symbol.symbol === selectedSymbol.symbol
                                                ? "primary"
                                                : "text"
                                        }
                                        key={symbol.symbol}
                                        block
                                        style={{ textAlign: "left" }}
                                        onClick={() => handleSelectSymbol(symbol)}
                                    >
                                        <Space size="middle">
                                            <GoldOutlined />
                                            {symbol.symbol}
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
                                {selectedSymbol === null ? (
                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Please select a symbol" />
                                ) : (
                                    <>
                                        <Space direction="vertical" style={{ width: "100%" }} size={0}>
                                            <Typography.Title level={5} style={{ margin: 0 }}>
                                                {selectedSymbol.symbol}
                                            </Typography.Title>
                                            <Typography.Text type="secondary" style={{ margin: 0 }}>
                                                Crypto
                                            </Typography.Text>
                                        </Space>

                                        <Typography.Title level={2} style={{ margin: 0 }}>
                                            <Space size="small">
                                                <span>{selectedSymbol.baseAsset}</span>
                                                <SwapOutlined style={{ fontSize: 16 }} />
                                                <span>{selectedSymbol.quoteAsset}</span>
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
                                {selectedSymbol === null ? (
                                    <div
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "center",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Empty
                                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                                            description="Please select a symbol to display chart"
                                        />
                                    </div>
                                ) : (
                                    <TradingViewChart
                                        symbol={selectedSymbol}
                                        mode={mode}
                                        predictedData={predictedData}
                                        timeframe={timeframe}
                                    />
                                )}
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
                                                selectedKeys: [timeframe.period],
                                                onClick: (e) => {
                                                    if (selectedSymbol === null) return;
                                                    setTimeframe(TIMEFRAME_OPTIONS[e.key]);
                                                },
                                            }}
                                            trigger={["click"]}
                                            disabled={selectedSymbol === null}
                                        >
                                            <Button onClick={(e) => e.preventDefault()} style={{ height: "100%" }}>
                                                {timeframe.period}
                                            </Button>
                                        </Dropdown>
                                    ) : (
                                        <Segmented
                                            options={Object.keys(TIMEFRAME_OPTIONS)}
                                            value={timeframe.period}
                                            onChange={(value) => setTimeframe(TIMEFRAME_OPTIONS[value as string])}
                                            disabled={selectedSymbol === null}
                                        />
                                    )}
                                </div>

                                <div className="trading-dashboard__chart-options__right">
                                    {mode === "normal" ? (
                                        <Dropdown
                                            menu={{
                                                items: Object.values(PREDICT_OPTIONS).map((val) => ({
                                                    key: val.key,
                                                    label: val.label,
                                                })),
                                                onClick: handlePredictBtn,
                                            }}
                                            trigger={["click"]}
                                            disabled={selectedSymbol === null}
                                        >
                                            <Button type="text" onClick={(e) => e.preventDefault()}>
                                                <Space>
                                                    <h4 style={{ margin: 0, color: token.colorPrimary }}>Predict</h4>
                                                    <RightOutlined style={{ color: token.colorPrimary }} />
                                                </Space>
                                            </Button>
                                        </Dropdown>
                                    ) : (
                                        <Space size="small">
                                            {mode === "predict-timeframe" && (
                                                <Button type="text" onClick={() => setOpenPredictOptionModal(true)}>
                                                    <SettingOutlined />
                                                </Button>
                                            )}
                                            <Popconfirm
                                                title="Quit prediction mode"
                                                description="Are you sure to quit the prediction mode?"
                                                onConfirm={handleQuitPredictionMode}
                                                okText="Yes"
                                                cancelText="No"
                                            >
                                                <Button type="text" danger>
                                                    <CloseOutlined />
                                                </Button>
                                            </Popconfirm>
                                        </Space>
                                    )}
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
            <PredictOptionModal
                open={openPredictOptionModal}
                options={predictOptions}
                onConfirm={handlePredictNextTimeframe}
                onCancel={() => setOpenPredictOptionModal(false)}
            />
        </>
    );
}
