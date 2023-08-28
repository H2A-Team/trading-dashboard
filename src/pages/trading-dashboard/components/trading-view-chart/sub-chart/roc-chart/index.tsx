import { IChartApi, ISeriesApi, UTCTimestamp, createChart } from "lightweight-charts";
import { ElementRef, useEffect, useRef, useState } from "react";
import { IPredictedLine } from "../..";
import { Button, InputNumber, Modal, Space, Typography } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { ISubChartProps, ITimeframePredictionResponse } from "../interfaces";
import "./index.scss";
import FetchingIndicator from "../../../fetching-indicator";
import { CHART_COLORS } from "../../../../constants";
import { useAntMessage } from "../../../../../../contexts/ant-message";
import { HttpService } from "../../../../../../services/http-service";

const defaultData: IPredictedLine = {
    label: "Rate of change",
    data: [],
};

export default function RocChart(props: ISubChartProps) {
    const { chartName, timeframe, selectedOption, symbol } = props;

    const messageApi = useAntMessage();

    const chartRef = useRef<ElementRef<"div"> | null>(null);
    const chart = useRef<IChartApi | null>(null);
    const chartSeries = useRef<{
        line: ISeriesApi<"Line">;
    } | null>(null);

    const [data, setData] = useState<IPredictedLine>(defaultData);
    const [openSetting, setOpenSetting] = useState(false);
    const [currentLength, setCurrentLength] = useState(9);
    const [length, setLength] = useState(9);
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

    // call the server for chart data
    useEffect(() => {
        const fetch = async () => {
            setIsLoading(true);
            try {
                const res = (await HttpService.post(`/v1/symbols/${symbol.symbol}/predict-timeframe`, {
                    model: selectedOption.selectedModel?.key,
                    interval: timeframe.interval,
                    indicatorTypes: [selectedOption.selectedFeature?.key],
                    rocLength: currentLength,
                })) as ITimeframePredictionResponse;

                if (res.roc) {
                    const respData = res.roc;
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
    }, [currentLength]);

    const openSettingModal = () => {
        setLength(currentLength);
        setOpenSetting(true);
    };

    const handleSubmit = () => {
        setCurrentLength(length);
        setOpenSetting(false);
    };

    const handleCancel = () => {
        setOpenSetting(false);
    };

    return (
        <>
            <FetchingIndicator loading={isLoading} />
            <div ref={chartRef} id="sub-chart__line-chart"></div>
            {/* Overlay element */}
            <div className="trading-view-chart__overlay trading-view-chart__overlay--top-left">
                <div className="overlay-item overlay-item--selectable">
                    <div className="overlay-item__card">
                        <div className="overlay__chart-setting">
                            <Button type="text" onClick={openSettingModal} size="small">
                                <SettingOutlined />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                title={`${
                    chartName ? (chartName.label !== "" ? chartName.label : "Chart options") : "Chart options"
                }`.toUpperCase()}
                centered
                open={openSetting}
                onOk={handleSubmit}
                onCancel={handleCancel}
                maskClosable={false}
                bodyStyle={{ paddingBlock: "16px" }}
            >
                <Space direction="vertical" style={{ width: "100%" }}>
                    <Typography.Text strong style={{ width: "100%" }}>
                        Length
                    </Typography.Text>
                    <InputNumber
                        min={1}
                        value={length}
                        onChange={(value) => setLength(value as number)}
                        style={{ width: "100%" }}
                    ></InputNumber>
                </Space>
            </Modal>
        </>
    );
}
