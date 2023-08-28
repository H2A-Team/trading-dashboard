import { ISymbol, ITimeframe } from "../../../..";
import { IPredictFeatureOption, IPredictOptionModalOptions } from "../../../predict-option-modal";

export interface ISubChartProps {
    chartName?: IPredictFeatureOption;
    symbol: ISymbol;
    timeframe: ITimeframe;
    selectedOption: IPredictOptionModalOptions;
    extra?: boolean;
}

export interface ITimeframePredictionResponse {
    close?: {
        timestamp: number;
        value: number;
    }[];
    roc?: {
        timestamp: number;
        value: number;
    }[];
    rsi?: {
        timestamp: number;
        value: number;
    }[];
}
