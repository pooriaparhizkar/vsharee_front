const BASE_URL = import.meta.env.VITE_API_URL;

export const API = {
    auth: {
        login: BASE_URL + '/auth/login',
        signup: BASE_URL + '/auth/signup',
    },
    profile: {
        mine: BASE_URL + '/profile/mine',
        search: (page: number, pageSize: number) => `${BASE_URL}/profile/search/${page}/${pageSize}`,
    },
};
