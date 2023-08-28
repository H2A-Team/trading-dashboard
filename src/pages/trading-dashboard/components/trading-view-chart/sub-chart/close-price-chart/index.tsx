import { IChartApi, ISeriesApi, UTCTimestamp, createChart } from "lightweight-charts";
import { ElementRef, useEffect, useRef, useState } from "react";
import { IPredictedLine } from "../..";
import { ISubChartProps, ITimeframePredictionResponse } from "../interfaces";
import "./index.scss";
import FetchingIndicator from "../../../fetching-indicator";
import { CHART_COLORS } from "../../../../constants";
import { HttpService } from "../../../../../../services/http-service";
import { useAntMessage } from "../../../../../../contexts/ant-message";

const defaultData: IPredictedLine = {
    label: "Close price",
    data: [],
};

export default function ClosePriceChart(props: ISubChartProps) {
    const { timeframe, selectedOption, symbol } = props;

    const messageApi = useAntMessage();

    const chartRef = useRef<ElementRef<"div"> | null>(null);
    const chart = useRef<IChartApi | null>(null);
    const chartSeries = useRef<{
        line: ISeriesApi<"Line">;
    } | null>(null);

    const [data, setData] = useState<IPredictedLine>(defaultData);
    const [isLoading, setIsLoading] = useState(false);

    // chart initialization effect
    useEffect(() => {
        // init chart
        if (chart.current !== null) return;
        if (data === null) return;

        chart.current = createChart(chartRef.current as HTMLElement, { autoSize: true });

        chartSeries.current = {
            line: chart.current.addLineSeries({ title: data.label, color: CHART_COLORS.LINE[0] }),
        };
    });

    // effect to update chart when data changed
    useEffect(() => {
        if (chartSeries.current === null) return;

        chartSeries.current.line.setData(data.data);

        chart.current?.timeScale().fitContent();
    }, [data]);

    useEffect(() => {
        const fetch = async () => {
            setIsLoading(true);
            try {
                const res = (await HttpService.post(`/v1/symbols/${symbol.symbol}/predict-timeframe`, {
                    model: selectedOption.selectedModel?.key,
                    interval: timeframe.interval,
                    indicatorTypes: [selectedOption.selectedFeature?.key],
                })) as ITimeframePredictionResponse;

                if (res.close) {
                    const respData = res.close;
                    const mappedData = respData.map((item) => ({
                        time: (item.timestamp / 1000) as UTCTimestamp,
                        value: item.value,
                    }));
                    setData((prev) => ({ ...prev, data: mappedData }));
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
            <div ref={chartRef} id="sub-chart__line-chart"></div>;
        </>
    );
}
