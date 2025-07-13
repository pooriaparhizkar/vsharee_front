import './initialLoading.style.scss';

const InitialLoading: React.FC = () => {
    return (
        <div className="initial-loading bg-primary-100 absolute top-0 left-0 z-50 flex h-screen w-screen items-center justify-center overflow-hidden">
            <h1>Logo</h1>
        </div>
    );
};

export default InitialLoading;
