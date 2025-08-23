import React, { useState } from 'react';
import Card from '@/utilities/components/card';
import Login from './login';
import Signup from './signup';
import Button from '@mui/material/Button';

const Authentication: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const VERSION = import.meta.env.VITE_VERSION;
    return (
        <div className="flex flex-col gap-3 h-dvh w-full items-center justify-center bg-[linear-gradient(135deg,var(--color-primary),#3c0b10,var(--color-background))] px-4">
            <Card className="max-w-[450px]" title={isLogin ? 'Login' : 'Signup'}>
                {isLogin ? <Login /> : <Signup />}
                <div className="mt-4 text-center">
                    {isLogin ? (
                        <Button size="small" variant="text" onClick={() => setIsLogin(false)}>
                            Don't have an account? Signup
                        </Button>
                    ) : (
                        <Button size="small" variant="text" onClick={() => setIsLogin(true)}>
                            Already have an account? Login
                        </Button>
                    )}
                </div>
            </Card>
            <label className='text-center flex items-center justify-center text-xs font-medium text-gray99'>
                V {VERSION}
            </label>
        </div>
    );
};

export default Authentication;
