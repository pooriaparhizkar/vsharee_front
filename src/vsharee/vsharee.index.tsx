import { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthStatus } from '../interfaces';
import InitialLoading from './initialLoading/initialLoading.index';
import { useAtom, useSetAtom } from 'jotai';
import { authStatusAtom, userDataAtom } from '@/atom';
import Header from './components/header';
import { PATH } from '@/data';
import { vshareeInitial } from './vsharee.script';
import Authentication from './auth';
import Dashboard from './dashboard';

const Vsharee: React.FC = () => {
    const [authStatus, setAuthStatus] = useAtom(authStatusAtom);
    const setUserData = useSetAtom(userDataAtom);
    useEffect(() => {
        vshareeInitial(setAuthStatus, setUserData);

        let angle = 0;
        const body = document.body;

        const animate = () => {
            angle = (angle + 0.5) % 360; // adjust increment for speed
            body.style.background = `linear-gradient(${angle}deg, var(--color-primary), #3c0b10, var(--color-background))`;
            requestAnimationFrame(animate);
        };

        animate();
    }, []);

    return (
        <Router>
            <Routes>
                {authStatus === AuthStatus.inValid && <Route path="*" element={<Authentication />} />}

                {authStatus === AuthStatus.valid && (
                    <Route
                        path="*"
                        element={
                            <div className="flex h-full w-full min-w-0 flex-col">
                                <Header />
                                <div
                                    className={`mt-[80px] flex h-full min-h-[calc(100vh-80px)] flex-1 flex-col p-4 transition-all max-lg:pb-[64px]`}
                                >
                                    <Routes>
                                        <Route path={PATH.dashboard} element={<Dashboard />} />

                                        <Route path="*" element={<Navigate to={PATH.dashboard} replace />} />
                                    </Routes>
                                </div>
                            </div>
                        }
                    />
                )}

                {authStatus === AuthStatus.pending && <Route path="*" element={<InitialLoading />} />}
            </Routes>
        </Router>
    );
};

export default Vsharee;
