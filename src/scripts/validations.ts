export function _emailValidation(value: string): boolean {
    const re =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(value.toLowerCase());
}

export function _passwordValidation(value: string): boolean {
    const regex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
    return regex.test(value);
}

export function _urlValidation(value: string): boolean {
    const re =
        /[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/;
    return re.test(value);
}

export function _usernameValidation(value: string): boolean {
    const re = /^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{0,29}$/i;
    return re.test(value);
}

export function _phoneValidation(value: string): boolean {
    const re = /^(09)\d{9}$/i;
    return re.test(value);
}

export function _trxValidation(value: string): boolean {
    const re = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
    return re.test(value);
}

export function _getValidUrl(url = '') {
    let newUrl = window.decodeURIComponent(url);
    newUrl = newUrl.trim().replace(/\s/g, '');

    if (/^(:\/\/)/.test(newUrl)) {
        return `http${newUrl}`;
    }
    if (!/^(f|ht)tps?:\/\//i.test(newUrl)) {
        return `http://${newUrl}`;
    }
    return newUrl;
}

export function _decimalValidation(value: string): string {
    let formattedValue = value.replace(/[^۰-۹0-9.]/g, '');

    if (formattedValue.split('.').length > 2) {
        formattedValue = formattedValue.slice(0, -1);
    }

    if (formattedValue.startsWith('.')) {
        formattedValue = '0' + formattedValue;
    }

    return formattedValue;
}
