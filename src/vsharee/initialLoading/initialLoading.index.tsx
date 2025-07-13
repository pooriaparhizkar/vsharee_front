import { useEffect } from 'react';
import Circle from '../../assets/images/circle.png';
import Logo from '../../assets/images/logo.png';
import './initialLoading.style.scss';

const InitialLoading: React.FC = () => {
    return (
        <div className="initial-loading absolute top-0 left-0 z-50 flex h-screen w-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,var(--color-primary),#3c0b10,var(--color-background))]">
            <img className="animate-scale absolute z-10 opacity-25" src={Circle} alt="30pay" />
            <img className="z-20 w-[100px]" src={Logo} alt="30pay" />
        </div>
    );
};

export default InitialLoading;
