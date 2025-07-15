const BASE_URL = import.meta.env.VITE_API_URL;

export const API = {
    auth: {
        login: BASE_URL + '/auth/login',
        signup: BASE_URL + '/auth/signup',
    },
    profile: {
        index: BASE_URL + '/profile',
        mine: BASE_URL + '/profile/mine',
        search: (page: number, pageSize: number) => `${API.profile.index}/search/${page}/${pageSize}`,
    },
    group: {
        index: BASE_URL + '/group',
        detail: (id: string) => `${API.group.index}/${id}`,
        getAll: (page: number, pageSize: number) => `${API.group.index}/${page}/${pageSize}`,
        mine: (page: number, pageSize: number) => `${API.group.index}/mine/${page}/${pageSize}`,
        verifyId: BASE_URL + '/group/verify-id',
    },
};
