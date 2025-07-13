import { AuthStatus, UserType } from '@/interfaces';
import { authToken, get } from '../scripts';
import { API } from '@/data';

export const vshareeInitial = (setAuthStatus: any, setUserData: any) => {
    return new Promise((res) => getProfile(setAuthStatus, setUserData).then(() => res(true)));
};

export const getProfile = (setAuthStatusAtom: any, setuserDataAtom: any) => {
    return new Promise((resolve) => {
        if (!authToken.get()) {
            setAuthStatusAtom(AuthStatus.inValid);
            resolve(true);
        } else {
            get<UserType>(API.profile.mine)
                .then((res) => {
                    setuserDataAtom(res.value);
                    setAuthStatusAtom(AuthStatus.valid);
                })
                .catch(({ status }) => {
                    if (status >= 500) console.log('Error');
                    else if (status >= 400) {
                        authToken.remove();
                        setAuthStatusAtom(AuthStatus.inValid);
                    } else console.log('Error');
                })
                .finally(() => resolve(true));
        }
    });
};
