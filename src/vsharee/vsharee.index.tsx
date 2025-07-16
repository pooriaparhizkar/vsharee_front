import { useContext, useEffect } from 'react';
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
import { hexToRgba } from '@/scripts';
import Group from './group';

const Vsharee: React.FC = () => {
    const [authStatus, setAuthStatus] = useAtom(authStatusAtom);
    const setUserData = useSetAtom(userDataAtom);
    const primary = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
    const primaryWithOpacity = hexToRgba(primary, 0.6);

    useEffect(() => {
        vshareeInitial(setAuthStatus, setUserData);

        let angle = 0;
        const body = document.body;

        const animate = () => {
            angle = (angle + 0.5) % 360; // adjust increment for speed
            body.style.background = `linear-gradient(${angle}deg, ${primaryWithOpacity}, #3c0b10, var(--color-background))`;
            requestAnimationFrame(animate);
        };

        // animate();
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
                                    className={`mt-[80px] flex h-full max-h-[calc(100vh-80px)] min-h-[calc(100vh-80px)] flex-1 flex-col overflow-auto p-4 transition-all`}
                                >
                                    <Routes>
                                        <Route path={PATH.dashboard} element={<Dashboard />} />
                                        <Route path={PATH.group(':id')} element={<Group />} />

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
