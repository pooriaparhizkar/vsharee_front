import { createTheme, ThemeProvider } from '@mui/material/styles';
import './utilities/styles/index.scss';
import Vsharee from './vsharee/vsharee.index';
import CssBaseline from '@mui/material/CssBaseline';

function App() {
    const darkTheme = createTheme({
        palette: {
            mode: 'dark',
            primary: {
                main: '#eb3942',
            },
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
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Vsharee />
        </ThemeProvider>
    );
}

export default App;
