import {
    CandlestickData,
    HistogramData,
    IChartApi,
    ISeriesApi,
    MouseEventHandler,
    UTCTimestamp,
    createChart,
} from "lightweight-charts";
import { ElementRef, useEffect, useRef, useState } from "react";
import {
    ICandleInfo,
    IChartData,
    IRealtimeCandleData,
    getLatestCandleData,
    pickCandleColor,
    pickVolumeColor,
} from "../..";
import FetchingIndicator from "../../../fetching-indicator";
import "./index.scss";
import { CHART_COLORS } from "../../../../constants";
import { ISymbol, ITimeframe } from "../../../..";
import { IPredictOptionModalOptions } from "../../../predict-option-modal";
import { HttpService } from "../../../../../../services/http-service";
import { useAntMessage } from "../../../../../../contexts/ant-message";

interface INextCandleChartProps {
    intialData: IChartData;
    timeframe: ITimeframe;
    selectedOption: IPredictOptionModalOptions;
    symbol: ISymbol;
}

const defaultChartData: IChartData = {
    candlestickData: [],
    histogramData: [],
};

export default function NextCandleChart(props: INextCandleChartProps) {
    const { intialData, timeframe, selectedOption, symbol } = props;

    const messageApi = useAntMessage();

    const mouseHandlerRef = useRef<MouseEventHandler>(() => {});
    const chartRef = useRef<ElementRef<"div"> | null>(null);
    const chart = useRef<IChartApi | null>(null);
    const chartSeries = useRef<{
        barSeries: ISeriesApi<"Bar">;
        histogramSeries: ISeriesApi<"Histogram">;
        candlestickSeries: ISeriesApi<"Candlestick">;
        predictedCandleSeries: ISeriesApi<"Candlestick">;
        predictedHistogramSeries: ISeriesApi<"Histogram">;
    } | null>(null);

    const [data, setData] = useState<IChartData>(defaultChartData);
    const [predictedCandle, setPredictedCandle] = useState<{
        candle: CandlestickData;
        volume: HistogramData;
    } | null>(null);
    const [hoveringCandleInfo, setHoveringCandleInfo] = useState<ICandleInfo>({});
    const [isLoading, setIsLoading] = useState(false);

    // chart initialization effect
    useEffect(() => {
        // init chart
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
                    priceLineVisible: false,
                    lastValueVisible: false,
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
                    priceLineVisible: false,
                    lastValueVisible: false,
                }),
                predictedHistogramSeries: chart.current.addHistogramSeries({
                    priceFormat: {
                        type: "volume",
                    },
                    priceScaleId: "",
                    title: "Predicted",
                }),
            };
        }

        chart.current.unsubscribeCrosshairMove(mouseHandlerRef.current);
        chart.current.unsubscribeClick(mouseHandlerRef.current);

        mouseHandlerRef.current = (param) => {
            if (param.point === undefined || !param.time || param.point.x < 0 || param.point.y < 0) {
                if (predictedCandle !== null) {
                    setHoveringCandleInfo(getLatestCandleData([predictedCandle.candle]));
                    return;
                }
                setHoveringCandleInfo(getLatestCandleData(data.candlestickData));
            } else {
                if (!chartSeries.current) {
                    if (predictedCandle !== null) {
                        setHoveringCandleInfo(getLatestCandleData([predictedCandle.candle]));
                        return;
                    }
                    setHoveringCandleInfo(getLatestCandleData(data.candlestickData));
                    return;
                }
                let seriesData: any = param.seriesData.get(chartSeries.current.candlestickSeries);
                if (!seriesData) {
                    seriesData = param.seriesData.get(chartSeries.current.predictedCandleSeries);
                    if (!seriesData) {
                        if (predictedCandle !== null) {
                            setHoveringCandleInfo(getLatestCandleData([predictedCandle.candle]));
                            return;
                        }
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

        chart.current.subscribeCrosshairMove(mouseHandlerRef.current);
        chart.current.subscribeClick(mouseHandlerRef.current);
    });

    // effect to update chart when data changed
    useEffect(() => {
        if (chartSeries.current === null) return;

        chartSeries.current.candlestickSeries.setData(data.candlestickData);

        if (predictedCandle) {
            chartSeries.current.predictedCandleSeries.setData(predictedCandle.candle ? [predictedCandle.candle] : []);
            chartSeries.current.predictedHistogramSeries.setData(
                predictedCandle.volume ? [predictedCandle.volume] : []
            );
        } else {
            chartSeries.current.predictedCandleSeries.setData([]);
            chartSeries.current.predictedHistogramSeries.setData([]);
        }

        chartSeries.current.histogramSeries.setData(data.histogramData);

        chart.current?.timeScale().scrollToRealTime();
        chartSeries.current.candlestickSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0,
                bottom: 0.3, // lowest point of the series will be 30% away from the bottom
            },
        });
        chartSeries.current.predictedCandleSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0,
                bottom: 0.3, // lowest point of the series will be 30% away from the bottom
            },
        });
        chartSeries.current.histogramSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0.8, // highest point of the series will be 70% away from the top
                bottom: 0,
            },
        });
        chartSeries.current.predictedHistogramSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0.8, // highest point of the series will be 70% away from the top
                bottom: 0,
            },
        });

        setHoveringCandleInfo(getLatestCandleData(data.candlestickData));
    }, [data, predictedCandle]);

    useEffect(() => {
        // TODO: call api to get predicted candle > append to data.predictedCandleSeries (check if there is a realtime candle then remove it before add)
        const fetch = async () => {
            setIsLoading(true);
            try {
                const res = (await HttpService.post(`/v1/symbols/${symbol.symbol}/predict-candle`, {
                    model: selectedOption.selectedModel?.key,
                    interval: timeframe.interval,
                })) as IRealtimeCandleData;

                if (res) {
                    setPredictedCandle(() => {
                        const time = (res.startIntervalTimestamp / 1000) as UTCTimestamp;
                        return {
                            candle: {
                                time: time,
                                open: parseFloat(res.openPrice),
                                high: parseFloat(res.highPrice),
                                low: parseFloat(res.lowPrice),
                                close: parseFloat(res.closePrice),
                            },
                            volume: {
                                time: time,
                                value: parseFloat(res.volume),
                                color: pickVolumeColor({
                                    open: parseFloat(res.openPrice),
                                    high: parseFloat(res.highPrice),
                                    low: parseFloat(res.lowPrice),
                                    close: parseFloat(res.closePrice),
                                }),
                            },
                        };
                    });
                    setData(intialData);
                } else {
                    messageApi.info("No prediction data");
                }
            } catch (error) {
                console.error(error);
                messageApi.error("There was an error when fetching prediction data");
            }
            setIsLoading(false);
        };

        fetch();
    }, []);

    return (
        <>
            <FetchingIndicator loading={isLoading} />
            <div ref={chartRef} id="sub-chart__next-candle-chart"></div>

            {/* Overlay element */}
            <div className="trading-view-chart__overlay trading-view-chart__overlay--top-left">
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
        </>
    );
}
