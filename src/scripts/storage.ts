import { Tokens } from '../interfaces';

export const _authToken = {
    key: '30PAY__AUTH_TOKEN',
    get: function (): Tokens | null {
        const data = localStorage.getItem(_authToken.key);
        if (data) {
            return JSON.parse(data);
        }
        return null;
    },
    set: (value: Tokens) => {
        localStorage.setItem(_authToken.key, JSON.stringify(value));
    },
    remove: () => {
        localStorage.removeItem(_authToken.key);
    },
};
