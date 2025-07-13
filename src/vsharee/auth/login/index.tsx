import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { authToken, emailValidation, passwordValidation, post } from '@/scripts';
import { API } from '@/data';
import { AuthStatus, loginType } from '@/interfaces';
import { useSetAtom } from 'jotai';
import { authStatusAtom, userDataAtom } from '@/atom';
import { Input } from '@/utilities/components';

const Login: React.FC = () => {
    const [submitLoading, setSubmitLoading] = React.useState(false);
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [emailError, setEmailError] = React.useState('');
    const [passwordError, setPasswordError] = React.useState('');
    const setUserData = useSetAtom(userDataAtom);
    const setAuthStatus = useSetAtom(authStatusAtom);

    const handleSubmit = (e?: any) => {
        if (e) e.preventDefault();
        let valid = true;

        if (!emailValidation(email)) {
            setEmailError('Please enter a valid email address.');
            valid = false;
        } else {
            setEmailError('');
        }

        if (!passwordValidation(password)) {
            setPasswordError('Password must be at least 8 characters and contain a number.');
            valid = false;
        } else {
            setPasswordError('');
        }

        if (!valid) return;

        setSubmitLoading(true);
        post<loginType>(API.auth.login, { email, password })
            .then((e) => {
                const { token, user } = e.value.value;
                authToken.set(token);
                setUserData(user);
                setAuthStatus(AuthStatus.valid);
            })
            .catch((err) => console.error(err))
            .finally(() => setSubmitLoading(false));
    };

    return (
        <Box component="form" noValidate onSubmit={handleSubmit}>
            <div className="flex flex-col gap-5">
                <Input
                    name="email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e)}
                    error={!!emailError}
                    helperText={emailError}
                />
                <Input
                    name="password"
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e)}
                    error={!!passwordError}
                    helperText={passwordError}
                    onEnter={handleSubmit}
                />
                <Button
                    onClick={handleSubmit}
                    loading={submitLoading}
                    type="submit"
                    variant="contained"
                    color="primary"
                >
                    Login
                </Button>
            </div>
        </Box>
    );
};

export default Login;
