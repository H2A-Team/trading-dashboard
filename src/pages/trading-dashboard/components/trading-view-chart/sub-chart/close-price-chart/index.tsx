import { IChartApi, ISeriesApi, createChart } from "lightweight-charts";
import { ElementRef, useEffect, useRef, useState } from "react";
import { IPredictedLine } from "../..";
import { ISubChartProps } from "../interfaces";
import "./index.scss";
import FetchingIndicator from "../../../fetching-indicator";
import { CHART_COLORS } from "../../../../constants";

const fakePredictedData: IPredictedLine = {
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
};

export default function ClosePriceChart(props: ISubChartProps) {
    const {} = props;

    const chartRef = useRef<ElementRef<"div"> | null>(null);
    const chart = useRef<IChartApi | null>(null);
    const chartSeries = useRef<{
        line: ISeriesApi<"Line">;
    } | null>(null);

    const [data, setData] = useState<IPredictedLine | null>(fakePredictedData);
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

        if (data === null) return;

        chartSeries.current.line.setData(data.data);

        chart.current?.timeScale().fitContent();
    }, [data]);

    return (
        <>
            <FetchingIndicator loading={isLoading} />
            <div ref={chartRef} id="sub-chart__line-chart"></div>;
        </>
    );
}
