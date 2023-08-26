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
import "./index.scss";
import { ISymbol, ITimeframe, TIMEFRAME_OPTIONS, TRADING_DASHBOARD_MODE } from "../..";
import { EyeOutlined } from "@ant-design/icons";
import { Space } from "antd";
import useSocket from "../../../../hooks/use-socket";
import { SOCKET_EMIT_EVENT, SOCKET_LISTEN_EVENT } from "../../../../constants/socket-constants";

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
    predictedData?: IPredictedData;
    timeframe: ITimeframe;
}

interface IChartData {
    candlestickData: CandlestickData[];
    histogramData: HistogramData[];
    predictedData: IPredictedData;
}

interface ICandleInfo {
    high?: number;
    low?: number;
    close?: number;
    open?: number;
}

interface IRealtimeCandleData {
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

export const CHART_COLORS = {
    UP: "#26a69a",
    DARKER_UP: "#c3e7d5",
    DOWN: "#ef5350",
    DARKER_DOWN: "#f8c1c6",
    LINE: ["#2962ff", "#ff6742"],
};

const getLatestCandleData = (candleStickData: CandlestickData[]): ICandleInfo => {
    if (candleStickData.length === 0) return {};
    const latestCandle = candleStickData[candleStickData.length - 1];

    return {
        open: latestCandle.open,
        high: latestCandle.high,
        low: latestCandle.low,
        close: latestCandle.close,
    };
};

const pickCandleColor = (candle: ICandleInfo): string | undefined => {
    if (candle.open == null || candle.close == null) return undefined;

    return candle.open <= candle.close ? CHART_COLORS.UP : CHART_COLORS.DOWN;
};

const pickVolumeColor = (candle: ICandleInfo): string | undefined => {
    if (candle.open == null || candle.close == null) return undefined;

    return candle.open <= candle.close ? CHART_COLORS.DARKER_UP : CHART_COLORS.DARKER_DOWN;
};

const defaultChartData: IChartData = {
    candlestickData: [],
    histogramData: [],
    predictedData: {},
};

export default function TradingViewChart(props: ITradingViewChartProps) {
    const { symbol, timeframe, mode, predictedData } = props;

    // custom hook
    const { socket, methods } = useSocket();

    // refs
    const joinedRoom = useRef(false);
    const chartRef = useRef<ElementRef<"div"> | null>(null);
    const subChartRef = useRef<ElementRef<"div"> | null>(null);
    const chart = useRef<IChartApi | null>(null);
    const subChart = useRef<IChartApi | null>(null);
    const chartSeries = useRef<{
        barSeries: ISeriesApi<"Bar">;
        baselineSeries: ISeriesApi<"Baseline">;
        histogramSeries: ISeriesApi<"Histogram">;
        candlestickSeries: ISeriesApi<"Candlestick">;
        predictedCandleSeries: ISeriesApi<"Candlestick">;
    } | null>(null);
    const subChartSeries = useRef<{
        predictedLines?: ISeriesApi<"Line">[];
    } | null>(null);

    // states
    const [data, setData] = useState<IChartData>(defaultChartData);
    const [hoveringCandleInfo, setHoveringCandleInfo] = useState<ICandleInfo>({});
    const [displaySubChart, setDisplaySubChart] = useState(false);
    const [innerTimeframe, setInnerTimeframe] = useState<ITimeframe>(TIMEFRAME_OPTIONS["3M"]);
    const [innerSymbol, setInnerSymbol] = useState<ISymbol | null>(null);
    const [currentRoomId, setCurrentRoomId] = useState<string>("");

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
                    candlestickData: [
                        ...prev.candlestickData,
                        {
                            open: parseFloat(data.openPrice),
                            close: parseFloat(data.closePrice),
                            high: parseFloat(data.highPrice),
                            low: parseFloat(data.lowPrice),
                            time: (data.startIntervalTimestamp / 1000) as UTCTimestamp,
                        },
                    ],
                    histogramData: [
                        ...prev.histogramData,
                        {
                            time: (data.startIntervalTimestamp / 1000) as UTCTimestamp,
                            value: parseFloat(data.volume),
                            color: pickVolumeColor({
                                open: parseFloat(data.openPrice),
                                close: parseFloat(data.closePrice),
                                high: parseFloat(data.highPrice),
                                low: parseFloat(data.lowPrice),
                            }),
                        },
                    ],
                };
            });
        },
        [innerSymbol]
    );

    // chart initialization effect
    useEffect(() => {
        // init main chart
        if (chart.current !== null) return;

        chart.current = createChart(chartRef.current as HTMLElement, { autoSize: true });
        chartSeries.current = {
            barSeries: chart.current.addBarSeries(),
            baselineSeries: chart.current.addBaselineSeries(),
            candlestickSeries: chart.current.addCandlestickSeries({
                upColor: CHART_COLORS.UP,
                downColor: CHART_COLORS.DOWN,
                borderVisible: false,
                wickUpColor: CHART_COLORS.UP,
                wickDownColor: CHART_COLORS.DOWN,
            }),
            predictedCandleSeries: chart.current.addCandlestickSeries({
                upColor: CHART_COLORS.UP,
                downColor: CHART_COLORS.DOWN,
                borderVisible: false,
                wickUpColor: CHART_COLORS.UP,
                wickDownColor: CHART_COLORS.DOWN,
                title: "Predicted",
            }),
            histogramSeries: chart.current.addHistogramSeries({
                priceFormat: {
                    type: "volume",
                },
                priceScaleId: "",
            }),
        };

        const mouseHandler: MouseEventHandler = (param) => {
            if (param.point === undefined || !param.time || param.point.x < 0 || param.point.y < 0) {
                setHoveringCandleInfo(getLatestCandleData(data.candlestickData));
            } else {
                if (!chartSeries.current) {
                    setHoveringCandleInfo(getLatestCandleData(data.candlestickData));
                    return;
                }
                let seriesData: any = param.seriesData.get(chartSeries.current.candlestickSeries);
                if (!seriesData) {
                    seriesData = param.seriesData.get(chartSeries.current.predictedCandleSeries);
                    if (!seriesData) {
                        setHoveringCandleInfo(getLatestCandleData(data.candlestickData));
                        return;
                    }
                }
                setHoveringCandleInfo({
                    open: seriesData?.open,
                    high: seriesData?.high,
                    low: seriesData?.low,
                    close: seriesData?.close,
                });
            }
        };

        chart.current.subscribeCrosshairMove(mouseHandler);
        chart.current.subscribeClick(mouseHandler);
    });

    // effect when predicted data was updated
    useEffect(() => {
        if (predictedData == null) {
            setData((val) => ({ ...val, predictedData: defaultChartData.predictedData }));
            return;
        }

        if (predictedData.nextCandle != null) {
            setData((val) => ({
                ...val,
                predictedData: { nextCandle: predictedData.nextCandle as CandlestickData[] },
            }));
        } else setData((val) => ({ ...val, predictedData: { ...val.predictedData, nextCandle: undefined } }));

        if (predictedData.nextTimeframe != null) {
            // init sub chart
            if (subChart.current === null)
                subChart.current = createChart(subChartRef.current as HTMLElement, { autoSize: true });
            const ref = subChart.current;

            if (subChartSeries.current !== null && subChartSeries.current.predictedLines != null) {
                subChartSeries.current.predictedLines.forEach((item) => ref.removeSeries(item));
                subChartSeries.current.predictedLines = undefined;
            }
            subChartSeries.current = {
                predictedLines: predictedData.nextTimeframe.map((line, index) =>
                    ref.addLineSeries({ title: line.label, color: CHART_COLORS.LINE[index % CHART_COLORS.LINE.length] })
                ),
            };
            setData((val) => ({
                ...val,
                predictedData: { nextTimeframe: predictedData.nextTimeframe as IPredictedLine[] },
            }));
            setDisplaySubChart(true);
        } else {
            setData((val) => ({ ...val, predictedData: { ...val.predictedData, nextTimeframe: undefined } }));
            setDisplaySubChart(false);
        }
    }, [predictedData]);

    // effect to update chart when data changed
    useEffect(() => {
        if (chartSeries.current === null) return;

        chartSeries.current.candlestickSeries.setData(data.candlestickData);

        chartSeries.current.predictedCandleSeries.setData(data.predictedData.nextCandle || []);

        chartSeries.current.histogramSeries.setData(data.histogramData);

        chart.current?.timeScale().fitContent();
        chartSeries.current.candlestickSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0,
                bottom: 0.3, // lowest point of the series will be 30% away from the bottom
            },
        });
        chartSeries.current.histogramSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0.9, // highest point of the series will be 70% away from the top
                bottom: 0,
            },
        });

        setHoveringCandleInfo(getLatestCandleData(data.candlestickData));

        if (
            subChartSeries.current === null ||
            subChartSeries.current.predictedLines == null ||
            data.predictedData.nextTimeframe == null
        )
            return;

        const nextTimeframe = data.predictedData.nextTimeframe;
        subChartSeries.current.predictedLines.forEach((line, index) => line.setData(nextTimeframe[index].data));
    }, [data]);

    useEffect(() => {
        if (displaySubChart) subChart.current?.timeScale().fitContent();
    }, [displaySubChart]);

    // effect executed when symbol changed
    useEffect(() => {
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
    }, [symbol, innerSymbol, currentRoomId]);

    useEffect(() => {
        if (!socket) return;
        if (!joinedRoom.current) return;

        socket.emit(SOCKET_EMIT_EVENT.leave_room, currentRoomId);
        joinedRoom.current = false;
        setData(defaultChartData);
        setInnerTimeframe(timeframe);
    }, [timeframe, innerTimeframe]);

    useEffect(() => {
        if (!socket) return;

        socket.removeAllListeners(SOCKET_LISTEN_EVENT.realtime_candle);

        socket.on(SOCKET_LISTEN_EVENT.realtime_candle, handleReceivedRealtimeCandle);
    }, [socket, handleReceivedRealtimeCandle]);

    useEffect(() => {
        if (!socket) return;
        if (joinedRoom.current) return;
        if (innerSymbol === null) return;

        const roomId = `${innerSymbol.symbol.toLowerCase()}@kline_${innerTimeframe.interval}`;
        socket.emit(SOCKET_EMIT_EVENT.join_room, roomId);
        joinedRoom.current = true;
        setCurrentRoomId(roomId);
    }, [socket, innerSymbol, innerTimeframe]);

    return (
        <>
            <div
                id="trading-view-chart__container"
                className={displaySubChart ? "trading-view-chart__container--splitted-half" : undefined}
                style={{ width: "100%", height: "100%" }}
            >
                {/* Chart element */}
                <div ref={chartRef} id="trading-view-chart__main-chart"></div>
                <div ref={subChartRef} id="trading-view-chart__sub-chart"></div>

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
