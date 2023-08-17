import { ElementRef, useRef, useEffect, useState } from "react";
import { IChartApi, ISeriesApi, CandlestickData, createChart, HistogramData } from "lightweight-charts";

interface ITradingViewChartProps {
    symbol: string;
}

export const CHART_COLORS = {
    UP: "#26a69a",
    DARKER_UP: "#c3e7d5",
    DOWN: "#ef5350",
    DARKER_DOWN: "#f8c1c6",
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

export default function TradingViewChart(props: ITradingViewChartProps) {
    const { symbol } = props;
    const chartRef = useRef<ElementRef<"div"> | null>(null);
    const chart = useRef<IChartApi | null>(null);
    const chartSeries = useRef<{
        barSeries: ISeriesApi<"Bar">;
        baselineSeries: ISeriesApi<"Baseline">;
        histogramSeries: ISeriesApi<"Histogram">;
        candlestickSeries: ISeriesApi<"Candlestick">;
    } | null>(null);
    const [data, setData] = useState<{
        candlestickData: CandlestickData[];
        histogramData: HistogramData[];
    }>({
        candlestickData: fakeData.candlestickData,
        histogramData: fakeData.histogramData,
    });

    useEffect(() => {
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
            histogramSeries: chart.current.addHistogramSeries({
                priceFormat: {
                    type: "volume",
                },
                priceScaleId: "",
            }),
        };
    });

    useEffect(() => {
        if (chartSeries.current === null) return;

        chartSeries.current.candlestickSeries.setData(data.candlestickData);

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
    }, [data]);

    useEffect(() => {
        symbol !== "" && console.log(`Symbol has changed to: ${symbol}`);
    }, [symbol]);

    return <div ref={chartRef} id="trading-view-chart__container" style={{ width: "100%", height: "100%" }}></div>;
}
