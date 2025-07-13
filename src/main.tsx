import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { ToastContainer } from 'react-toastify';

createRoot(document.getElementById('root')!).render(
    <>
        <ToastContainer
            position={'bottom-left'}
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
            className="text-sm"
        />
        <App />
    </>,
);
