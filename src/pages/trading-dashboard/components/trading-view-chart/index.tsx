import { ElementRef, useRef, useEffect, useState, useCallback } from "react";
import {
    IChartApi,
    ISeriesApi,
    CandlestickData,
    createChart,
    HistogramData,
    MouseEventHandler,
    LineData,
    UTCTimestamp,
} from "lightweight-charts";
import { ISymbol, ITimeframe, TIMEFRAME_OPTIONS, TRADING_DASHBOARD_MODE } from "../..";
import { EyeOutlined } from "@ant-design/icons";
import { Space } from "antd";
import useSocket from "../../../../hooks/use-socket";
import { SOCKET_EMIT_EVENT, SOCKET_LISTEN_EVENT } from "../../../../constants/socket-constants";
import { useAntMessage } from "../../../../contexts/ant-message";
import { HttpService } from "../../../../services/http-service";
import { IPredictOptionModalOptions } from "../predict-option-modal";
import ClosePriceChart from "./sub-chart/close-price-chart";
import RocChart from "./sub-chart/roc-chart";
import { ISubChartProps } from "./sub-chart/interfaces";
import FetchingIndicator from "../fetching-indicator";
import "./index.scss";
import NextCandleChart from "./sub-chart/next-candle-chart";
import { CHART_COLORS } from "../../constants";

export interface IPredictedLine {
    label: string;
    data: LineData[];
}

export interface IPredictedData {
    nextCandle?: CandlestickData[];
    nextTimeframe?: IPredictedLine[];
}

interface ITradingViewChartProps {
    symbol: ISymbol | null;
    mode: TRADING_DASHBOARD_MODE;
    selectedPredictionOption: IPredictOptionModalOptions;
    timeframe: ITimeframe;
}

export interface IChartData {
    candlestickData: CandlestickData[];
    histogramData: HistogramData[];
}

export interface ICandleInfo {
    high?: number;
    low?: number;
    close?: number;
    open?: number;
}

export interface IRealtimeCandleData {
    binanceEventTimestamp: number;
    symbol: string;
    startIntervalTimestamp: number;
    endIntervalTimestamp: number;
    interval: string;
    openPrice: string;
    closePrice: string;
    highPrice: string;
    lowPrice: string;
    volume: string;
}

export const getLatestCandleData = (candleStickData: CandlestickData[]): ICandleInfo => {
    if (candleStickData.length === 0) return {};
    const latestCandle = candleStickData[candleStickData.length - 1];

    return {
        open: latestCandle.open,
        high: latestCandle.high,
        low: latestCandle.low,
        close: latestCandle.close,
    };
};

export const pickCandleColor = (candle: ICandleInfo): string | undefined => {
    if (candle.open == null || candle.close == null) return undefined;

    return candle.open <= candle.close ? CHART_COLORS.UP : CHART_COLORS.DOWN;
};

export const pickVolumeColor = (candle: ICandleInfo): string | undefined => {
    if (candle.open == null || candle.close == null) return undefined;

    return candle.open <= candle.close ? CHART_COLORS.DARKER_UP : CHART_COLORS.DARKER_DOWN;
};

export const convertRealtimeCandlestickToCandlestickData = (data: IRealtimeCandleData): CandlestickData => {
    return {
        open: parseFloat(data.openPrice),
        close: parseFloat(data.closePrice),
        high: parseFloat(data.highPrice),
        low: parseFloat(data.lowPrice),
        time: (data.startIntervalTimestamp / 1000) as UTCTimestamp,
    };
};

export const convertRealtimeCandlestickToHistogramData = (data: IRealtimeCandleData): HistogramData => {
    return {
        time: (data.startIntervalTimestamp / 1000) as UTCTimestamp,
        value: parseFloat(data.volume),
        color: pickVolumeColor({
            open: parseFloat(data.openPrice),
            close: parseFloat(data.closePrice),
            high: parseFloat(data.highPrice),
            low: parseFloat(data.lowPrice),
        }),
    };
};

const defaultChartData: IChartData = {
    candlestickData: [],
    histogramData: [],
};

// format: key: component
const SUB_CHART_COMPONENT: { [key: string]: (props: ISubChartProps) => JSX.Element } = {
    close: (props: ISubChartProps) => <ClosePriceChart {...props} />,
    roc: (props: ISubChartProps) => <RocChart {...props} />,
};

export default function TradingViewChart(props: ITradingViewChartProps) {
    const { symbol, timeframe, mode, selectedPredictionOption } = props;

    // custom hook
    const { socket, methods } = useSocket();
    const messageApi = useAntMessage();

    // refs
    const joinedRoom = useRef(false);
    const mouseHandlerRef = useRef<MouseEventHandler>(() => {});
    const chartRef = useRef<ElementRef<"div"> | null>(null);
    const chart = useRef<IChartApi | null>(null);
    const chartSeries = useRef<{
        barSeries: ISeriesApi<"Bar">;
        histogramSeries: ISeriesApi<"Histogram">;
        candlestickSeries: ISeriesApi<"Candlestick">;
    } | null>(null);

    // states
    const [data, setData] = useState<IChartData>(defaultChartData);
    const [hoveringCandleInfo, setHoveringCandleInfo] = useState<ICandleInfo>({});
    const [displaySubChart, setDisplaySubChart] = useState(false);
    const [innerTimeframe, setInnerTimeframe] = useState<ITimeframe>(TIMEFRAME_OPTIONS["5D"]);
    const [innerSymbol, setInnerSymbol] = useState<ISymbol | null>(null);
    const [currentRoomId, setCurrentRoomId] = useState<string>("");
    const [isFetchingTimeframeData, setIsFetchingTimeframeData] = useState(true);
    const [autoFitChartTime, setAutoFitChartTime] = useState(true);

    // socket handlers
    const handleReceivedRealtimeCandle = useCallback(
        (data: IRealtimeCandleData) => {
            if (innerSymbol === null) return;
            if (data.symbol !== innerSymbol.symbol) return;

            setData((prev) => {
                const foundCandle = prev.candlestickData.find(
                    (candle) => (candle.time as UTCTimestamp) === ((data.startIntervalTimestamp / 1000) as UTCTimestamp)
                );
                const foundVolume = prev.histogramData.find(
                    (volume) => (volume.time as UTCTimestamp) === ((data.startIntervalTimestamp / 1000) as UTCTimestamp)
                );

                if (foundCandle) {
                    foundCandle.open = parseFloat(data.openPrice);
                    foundCandle.close = parseFloat(data.closePrice);
                    foundCandle.high = parseFloat(data.highPrice);
                    foundCandle.low = parseFloat(data.lowPrice);

                    if (foundVolume) {
                        foundVolume.value = parseFloat(data.volume);
                        foundVolume.color = pickVolumeColor({
                            open: foundCandle.open,
                            close: foundCandle.close,
                            high: foundCandle.high,
                            low: foundCandle.low,
                        });
                    }

                    return { ...prev };
                }

                return {
                    ...prev,
                    candlestickData: [...prev.candlestickData, convertRealtimeCandlestickToCandlestickData(data)],
                    histogramData: [...prev.histogramData, convertRealtimeCandlestickToHistogramData(data)],
                };
            });
        },
        [innerSymbol]
    );

    // chart initialization effect
    useEffect(() => {
        if (isFetchingTimeframeData) return;
        // init main chart
        if (chart.current === null) {
            chart.current = createChart(chartRef.current as HTMLElement, { autoSize: true });
            chartSeries.current = {
                barSeries: chart.current.addBarSeries(),
                candlestickSeries: chart.current.addCandlestickSeries({
                    upColor: CHART_COLORS.UP,
                    downColor: CHART_COLORS.DOWN,
                    borderVisible: false,
                    wickUpColor: CHART_COLORS.UP,
                    wickDownColor: CHART_COLORS.DOWN,
                }),
                histogramSeries: chart.current.addHistogramSeries({
                    priceFormat: {
                        type: "volume",
                    },
                    priceScaleId: "",
                }),
            };
        }

        chart.current.unsubscribeCrosshairMove(mouseHandlerRef.current);
        chart.current.unsubscribeClick(mouseHandlerRef.current);

        mouseHandlerRef.current = (param) => {
            if (param.point === undefined || !param.time || param.point.x < 0 || param.point.y < 0) {
                setHoveringCandleInfo(getLatestCandleData(data.candlestickData));
            } else {
                if (!chartSeries.current) {
                    setHoveringCandleInfo(getLatestCandleData(data.candlestickData));
                    return;
                }
                let seriesData: any = param.seriesData.get(chartSeries.current.candlestickSeries);
                setHoveringCandleInfo({
                    open: seriesData?.open,
                    high: seriesData?.high,
                    low: seriesData?.low,
                    close: seriesData?.close,
                });
            }
        };

        chart.current.subscribeCrosshairMove(mouseHandlerRef.current);
        chart.current.subscribeClick(mouseHandlerRef.current);
    });

    // effect when predicted data was updated
    useEffect(() => {
        if (isFetchingTimeframeData) return;
        if (mode === "normal") {
            setDisplaySubChart(false);
            return;
        }

        setDisplaySubChart(true);
    }, [mode, isFetchingTimeframeData]);

    // effect to update chart when data changed
    useEffect(() => {
        if (isFetchingTimeframeData) return;
        if (chartSeries.current === null) return;

        chartSeries.current.candlestickSeries.setData(data.candlestickData);

        chartSeries.current.histogramSeries.setData(data.histogramData);

        let autoScalePrice = false;
        if (autoFitChartTime) {
            chart.current?.timeScale().fitContent();
            autoScalePrice = true;
            setAutoFitChartTime(false);
        }
        chartSeries.current.candlestickSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0,
                bottom: 0.3, // lowest point of the series will be 30% away from the bottom
            },
            autoScale: autoScalePrice,
        });
        chartSeries.current.histogramSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0.8, // highest point of the series will be 70% away from the top
                bottom: 0,
            },
            autoScale: autoScalePrice,
        });

        setHoveringCandleInfo(getLatestCandleData(data.candlestickData));
    }, [data, isFetchingTimeframeData, autoFitChartTime]);

    // effect executed when symbol changed
    useEffect(() => {
        if (isFetchingTimeframeData) return;
        if (symbol === null) return;
        if (socket) {
            if (symbol.symbol !== innerSymbol?.symbol) {
                socket.emit(SOCKET_EMIT_EVENT.leave_room, currentRoomId);
                setData(defaultChartData);
                joinedRoom.current = false;
                setInnerSymbol(symbol);
            }
        } else {
            setInnerSymbol(symbol);
            methods.initSocket();
            joinedRoom.current = false;
        }
    }, [symbol, innerSymbol, currentRoomId, isFetchingTimeframeData]);

    useEffect(() => {
        if (isFetchingTimeframeData) return;
        if (!socket) return;
        if (!joinedRoom.current) return;

        socket.emit(SOCKET_EMIT_EVENT.leave_room, currentRoomId);
        joinedRoom.current = false;
        setData(defaultChartData);
        setInnerTimeframe(timeframe);
    }, [timeframe, innerTimeframe, isFetchingTimeframeData]);

    useEffect(() => {
        if (isFetchingTimeframeData) return;
        if (!socket) return;

        socket.removeAllListeners(SOCKET_LISTEN_EVENT.realtime_candle);

        socket.on(SOCKET_LISTEN_EVENT.realtime_candle, handleReceivedRealtimeCandle);
    }, [socket, handleReceivedRealtimeCandle, isFetchingTimeframeData]);

    useEffect(() => {
        if (isFetchingTimeframeData) return;
        if (!socket) return;
        if (joinedRoom.current) return;
        if (innerSymbol === null) return;

        const roomId = `${innerSymbol.symbol.toLowerCase()}@kline_${innerTimeframe.interval}`;
        socket.emit(SOCKET_EMIT_EVENT.join_room, roomId);
        joinedRoom.current = true;
        setCurrentRoomId(roomId);
    }, [socket, innerSymbol, innerTimeframe, isFetchingTimeframeData]);

    useEffect(() => {
        if (symbol === null) return;
        const fetchTimeframeData = async () => {
            setIsFetchingTimeframeData(true);
            setAutoFitChartTime(true);
            try {
                const res = await HttpService.get<IRealtimeCandleData[]>(
                    `/v1/symbols/${symbol.symbol}/candles?interval=${timeframe.interval}`
                );

                if (res.data) {
                    const respData = res.data;
                    setData((prev) => {
                        const candleStickData: CandlestickData[] = [];
                        const histogramData: HistogramData[] = [];

                        respData.forEach((symbol) => {
                            candleStickData.push(convertRealtimeCandlestickToCandlestickData(symbol));
                            histogramData.push(convertRealtimeCandlestickToHistogramData(symbol));
                        });

                        return {
                            ...prev,
                            candlestickData: candleStickData,
                            histogramData: histogramData,
                        };
                    });
                }
            } catch (error) {
                console.error(error);
                messageApi.error("There was an error when fetching timeframe data");
            }
            setIsFetchingTimeframeData(false);
        };

        fetchTimeframeData();
    }, [symbol, timeframe]);

    const renderSubChart = () => {
        if (!displaySubChart) return null;

        switch (mode) {
            case "normal": {
                return null;
            }

            case "predict-candle": {
                return <NextCandleChart intialData={data} />;
            }

            case "predict-timeframe": {
                if (selectedPredictionOption.selectedFeature === null) return null;

                return SUB_CHART_COMPONENT[selectedPredictionOption.selectedFeature.key]({
                    chartName: selectedPredictionOption.selectedFeature,
                });
            }

            default: {
                return null;
            }
        }
    };

    return (
        <>
            <div
                id="trading-view-chart__container"
                className={displaySubChart ? "trading-view-chart__container--splitted-half" : undefined}
                style={{ width: "100%", height: "100%" }}
            >
                <FetchingIndicator loading={isFetchingTimeframeData} />

                {/* Chart element */}
                <div ref={chartRef} id="trading-view-chart__main-chart"></div>
                <div id="trading-view-chart__sub-chart">{renderSubChart()}</div>

                {/* Overlay element */}
                <div className="trading-view-chart__overlay trading-view-chart__overlay--top-left">
                    {/* Mode indicator */}
                    {mode !== "normal" && (
                        <div className="overlay-item">
                            <div className="overlay-item__card">
                                <Space size="small">
                                    <EyeOutlined />
                                    Prediction mode
                                </Space>
                            </div>
                        </div>
                    )}

                    {/* Hovering/Clicked candle information */}
                    <div className="overlay-item">
                        <div className="overlay-item__card">
                            <div className="overlay__hovering-item-info">
                                <span>
                                    <span>O</span>
                                    <span style={{ color: pickCandleColor(hoveringCandleInfo) }}>
                                        {hoveringCandleInfo.open != null ? hoveringCandleInfo.open.toFixed(2) : ""}
                                    </span>
                                </span>
                                <span>
                                    <span>H</span>
                                    <span style={{ color: pickCandleColor(hoveringCandleInfo) }}>
                                        {hoveringCandleInfo.high != null ? hoveringCandleInfo.high.toFixed(2) : ""}
                                    </span>
                                </span>
                                <span>
                                    <span>L</span>
                                    <span style={{ color: pickCandleColor(hoveringCandleInfo) }}>
                                        {hoveringCandleInfo.low != null ? hoveringCandleInfo.low.toFixed(2) : ""}
                                    </span>
                                </span>
                                <span>
                                    <span>C</span>
                                    <span style={{ color: pickCandleColor(hoveringCandleInfo) }}>
                                        {hoveringCandleInfo.close != null ? hoveringCandleInfo.close.toFixed(2) : ""}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
