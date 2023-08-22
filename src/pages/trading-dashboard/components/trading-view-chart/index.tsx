import { ElementRef, useRef, useEffect, useState } from "react";
import {
    IChartApi,
    ISeriesApi,
    CandlestickData,
    createChart,
    HistogramData,
    MouseEventHandler,
    LineData,
} from "lightweight-charts";
import "./index.scss";
import { TRADING_DASHBOARD_MODE } from "../..";
import { EyeOutlined } from "@ant-design/icons";
import { Space } from "antd";

export interface IPredictedLine {
    label: string;
    data: LineData[];
}

export interface IPredictedData {
    nextCandle?: CandlestickData[];
    nextTimeframe?: IPredictedLine[];
}

interface ITradingViewChartProps {
    symbol: string;
    mode: TRADING_DASHBOARD_MODE;
    predictedData?: IPredictedData;
}

interface IChartData {
    candlestickData: CandlestickData[];
    histogramData: HistogramData[];
    predictedData: IPredictedData;
}

export const CHART_COLORS = {
    UP: "#26a69a",
    DARKER_UP: "#c3e7d5",
    DOWN: "#ef5350",
    DARKER_DOWN: "#f8c1c6",
    LINE: ["#2962ff", "#ff6742"],
};

interface ICandleInfo {
    high?: number;
    low?: number;
    close?: number;
    open?: number;
}

const getLatestCandleData = (candleStickData: CandlestickData[]): ICandleInfo => {
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

    return candle.open < candle.close ? CHART_COLORS.UP : CHART_COLORS.DOWN;
};

const fakeData = {
    areaDate: [
        { time: "2018-12-22", value: 32.51 },
        { time: "2018-12-23", value: 31.11 },
        { time: "2018-12-24", value: 27.02 },
        { time: "2018-12-25", value: 27.32 },
        { time: "2018-12-26", value: 25.17 },
        { time: "2018-12-27", value: 28.89 },
        { time: "2018-12-28", value: 25.46 },
        { time: "2018-12-29", value: 23.92 },
        { time: "2018-12-30", value: 22.68 },
        { time: "2018-12-31", value: 22.67 },
    ],
    candlestickData: [
        { time: "2018-12-22", open: 75.16 + 200, high: 82.84 + 200, low: 36.16 + 200, close: 45.72 + 200 },
        { time: "2018-12-23", open: 45.12 + 200, high: 53.9 + 200, low: 45.12 + 200, close: 48.09 + 200 },
        { time: "2018-12-24", open: 60.71 + 200, high: 60.71 + 200, low: 53.39 + 200, close: 59.29 + 200 },
        { time: "2018-12-25", open: 68.26 + 200, high: 68.26 + 200, low: 59.04 + 200, close: 60.5 + 200 },
        { time: "2018-12-26", open: 67.71 + 200, high: 105.85 + 200, low: 66.67 + 200, close: 91.04 + 200 },
        { time: "2018-12-27", open: 91.04 + 200, high: 121.4 + 200, low: 82.7 + 200, close: 111.4 + 200 },
        { time: "2018-12-28", open: 111.51 + 200, high: 142.83 + 200, low: 103.34 + 200, close: 131.25 + 200 },
        { time: "2018-12-29", open: 131.33 + 200, high: 151.17 + 200, low: 77.68 + 200, close: 96.43 + 200 },
        { time: "2018-12-30", open: 106.33 + 200, high: 110.2 + 200, low: 90.39 + 200, close: 98.1 + 200 },
        { time: "2018-12-31", open: 109.87 + 200, high: 114.69 + 200, low: 85.66 + 200, close: 111.26 + 200 },
    ],
    histogramData: [
        { time: "2018-12-22", value: 32.51, color: CHART_COLORS.DARKER_DOWN },
        { time: "2018-12-23", value: 31.11, color: CHART_COLORS.DARKER_UP },
        { time: "2018-12-24", value: 27.02, color: CHART_COLORS.DARKER_DOWN },
        { time: "2018-12-25", value: 27.32, color: CHART_COLORS.DARKER_DOWN },
        { time: "2018-12-26", value: 25.17, color: CHART_COLORS.DARKER_UP },
        { time: "2018-12-27", value: 28.89, color: CHART_COLORS.DARKER_UP },
        { time: "2018-12-28", value: 25.46, color: CHART_COLORS.DARKER_UP },
        { time: "2018-12-29", value: 23.92, color: CHART_COLORS.DARKER_DOWN },
        { time: "2018-12-30", value: 22.68, color: CHART_COLORS.DARKER_DOWN },
        { time: "2018-12-31", value: 22.67, color: CHART_COLORS.DARKER_UP },
    ],
};

const defaultChartData: IChartData = {
    candlestickData: fakeData.candlestickData,
    histogramData: fakeData.histogramData,
    predictedData: {},
};

export default function TradingViewChart(props: ITradingViewChartProps) {
    const { symbol, mode, predictedData } = props;

    // refs
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
        symbol !== "" && console.log(`Symbol has changed to: ${symbol}`);
    }, [symbol]);

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
