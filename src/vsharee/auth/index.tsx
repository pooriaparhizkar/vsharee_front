import React, { useState } from 'react';
import Card from '@/utilities/components/card';
import Login from './login';
import Signup from './signup';
import Button from '@mui/material/Button';

const Authentication: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    return (
        <div className="flex h-dvh w-full items-center justify-center bg-[linear-gradient(135deg,var(--color-primary),#3c0b10,var(--color-background))] px-4">
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
        </div>
    );
};

export default Authentication;
