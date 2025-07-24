import { useEffect, useState, createContext } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import './utilities/styles/index.scss';
import Vsharee from './vsharee/vsharee.index';
import CssBaseline from '@mui/material/CssBaseline';
import { SocketContext, createSocket } from '@/context/SocketContext';
import { vshareeInitial } from './vsharee/vsharee.script';
import { authToken } from './scripts';
import type { Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@/interfaces';
import { useSetAtom } from 'jotai';
import { authStatusAtom, userDataAtom } from './atom';

export const SocketSetterContext = createContext<(socket: Socket<ServerToClientEvents, ClientToServerEvents>) => void>(
    () => {},
);

function App() {
    const [socketInstance, setSocketInstance] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(
        null,
    );
    const setAuthStatus = useSetAtom(authStatusAtom);
    const setUserData = useSetAtom(userDataAtom);

    useEffect(() => {
        vshareeInitial(setAuthStatus, setUserData).then(() => {
            const token = authToken.get();
            if (token) {
                setSocketInstance(createSocket(token));
            }
        });
    }, []);

    const darkTheme = createTheme({
        palette: {
            mode: 'dark',
            primary: { main: '#eb3942' },
        },
        components: {
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'white',
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                            color: 'white',
                        },
                    },
                },
            },
        },
    });

    return (
        <SocketSetterContext.Provider value={setSocketInstance}>
            <SocketContext.Provider value={socketInstance}>
                <ThemeProvider theme={darkTheme}>
                    <CssBaseline />
                    <Vsharee />
                </ThemeProvider>
            </SocketContext.Provider>
        </SocketSetterContext.Provider>
    );
}

export default App;
