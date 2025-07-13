export const _authToken = {
    key: 'VSHAREE__AUTH_TOKEN',
    get: function (): string | null {
        const data = localStorage.getItem(_authToken.key);
        if (data) {
            return data;
        }
        return null;
    },
    set: (value: string) => {
        localStorage.setItem(_authToken.key, value);
    },
    remove: () => {
        localStorage.removeItem(_authToken.key);
    },
};
