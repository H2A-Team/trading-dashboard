import { useState, useEffect } from "react";
import { Form, Modal, Select, Space } from "antd";
import { FEATURE_OPTION, MODEL_OPTION } from "../..";

export interface IPredictModelOption {
    key: MODEL_OPTION;
    label: string;
}

export interface IPredictFeatureOption {
    key: FEATURE_OPTION;
    label: string;
}

export interface IPredictOptionModalOptions {
    modelsList: IPredictModelOption[];
    selectedModel: IPredictModelOption | null; // cannot select more than 1 model to predict at a time

    featuresList: IPredictFeatureOption[];
    selectedFeature: IPredictFeatureOption | null; // cannot select more than 1 feature to predict at a time
}

interface IPredictOptionModalProps {
    open: boolean;
    options: IPredictOptionModalOptions;
    onConfirm: (form: IPredictOptionForm) => void;
    onCancel: () => void;
}

export interface IPredictOptionForm {
    feature: IPredictFeatureOption;
    model: IPredictModelOption;
}

const defaultOptions: IPredictOptionModalOptions = {
    modelsList: [],
    selectedModel: null,

    featuresList: [],
    selectedFeature: null,
};

export default function PredictOptionModal(props: IPredictOptionModalProps) {
    const { open, options, onConfirm, onCancel } = props;
    const [modalOptions, setModalOptions] = useState<IPredictOptionModalOptions>(defaultOptions);
    const [form] = Form.useForm();

    useEffect(() => {
        if (open) {
            setModalOptions(() => {
                form.setFieldsValue({
                    model: options.selectedModel?.key,
                    feature: options.selectedFeature?.key,
                });
                return options;
            });
        }
    }, [open, options]);

    const onFinish = (formData: { feature: string; model: string }) => {
        onConfirm &&
            onConfirm({
                feature: {
                    key: formData.feature as FEATURE_OPTION,
                    label: `${modalOptions.featuresList.find((i) => i.key === formData.feature)?.label}`,
                },
                model: (modalOptions.modelsList.find((i) => i.key === formData.model) as IPredictModelOption) || {
                    key: "undefined",
                    label: "undefined",
                },
            });
    };

    const onFinishFailed = () => {
        console.log("Submit failed!");
    };

    const handleSubmit = () => {
        form.submit();
    };

    const handleCancel = () => {
        onCancel && onCancel();
    };

    return (
        <Modal
            title={"prediction options".toUpperCase()}
            centered
            open={open}
            onOk={handleSubmit}
            onCancel={handleCancel}
            okText="Predict"
            maskClosable={false}
            bodyStyle={{ paddingBlock: "16px" }}
        >
            <Form form={form} layout="vertical" onFinish={onFinish} onFinishFailed={onFinishFailed} autoComplete="off">
                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                    <Form.Item
                        name="model"
                        label="Model"
                        rules={[{ required: true, message: "Please select at least 1 model" }]}
                    >
                        <Select
                            allowClear
                            showSearch
                            placeholder="Select a model to predict"
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                            }
                            options={options.modelsList.map((option) => ({
                                value: option.key,
                                label: option.label,
                            }))}
                        />
                    </Form.Item>

                    <Form.Item
                        name="feature"
                        label="Feature"
                        rules={[{ required: true, message: "Please select feature for prediction" }]}
                    >
                        <Select
                            allowClear
                            showSearch
                            style={{ width: "100%" }}
                            placeholder="Select feature to predict"
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                            }
                            options={options.featuresList.map((feature) => ({
                                value: feature.key,
                                label: feature.label,
                            }))}
                        />
                    </Form.Item>
                </Space>
            </Form>
        </Modal>
    );
}
