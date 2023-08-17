interface IAppFrame {
    layout: React.ReactNode;
}

function AppFrame(props: IAppFrame) {
    return props.layout;
}

export default AppFrame;
