import { Response } from '@/interfaces';
import { toast } from 'react-toastify';
import { authToken } from './index';

function generateHeader(object: any = {}): any {
    const header: { [k: string]: any } = {};
    if (authToken.get()) {
        header['Authorization'] = 'Bearer ' + authToken.get();
    }
    for (const key of Object.keys(object)) {
        header[key] = object[key];
    }
    return header;
}
export function _del<R>(url: string): Promise<Response<R>> {
    let status: number;
    return new Promise((resolve, reject) => {
        fetch(url, {
            method: 'DELETE',
            headers: generateHeader({ 'Content-Type': 'application/json' }),
        })
            .then(function (response) {
                status = response.status;
                return response.json();
            })
            .then(function (data) {
                if (responseValidator(status)) resolve({ value: data, status });
                else {
                    handleErrors(data);
                    reject({ data, status });
                }
            })
            .catch((/* err */) => {
                if (status === 401 || status === 403) reject({ data: null, status });
            });
    });
}

// post request
export function _post<R>(url: string, body: any): Promise<Response<R>> {
    let status: number;
    return new Promise((resolve, reject) => {
        fetch(url, {
            method: 'POST',
            headers: generateHeader({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(body),
        })
            .then(function (response) {
                status = response.status;
                return response.json();
            })
            .then(function (data) {
                if (responseValidator(status)) resolve({ value: data, status });
                else {
                    handleErrors(data);
                    reject({ data, status });
                }
            })
            .catch((/* err */) => {
                if (status === 401 || status === 403) reject({ data: null, status });
            });
    });
}

export function _postFormData<R>(url: string, formData: FormData): Promise<Response<R>> {
    let status: number;

    return new Promise((resolve, reject) => {
        fetch(url, {
            method: 'POST',
            headers: generateHeader(), // No 'Content-Type' header needed for FormData
            body: formData,
        })
            .then((response) => {
                status = response.status;
                return response.json();
            })
            .then((data) => {
                if (responseValidator(status)) {
                    resolve({ value: data, status });
                } else {
                    handleErrors(data);
                    reject({ data, status });
                }
            })
            .catch(() => {
                if (status === 401 || status === 403) reject({ data: null, status });
            });
    });
}

// form request (not post, like html form submit)
export function _form<R>(url: string, body: any): Promise<Response<R>> {
    let status: number;
    return new Promise((resolve, reject) => {
        fetch(url, {
            method: 'POST',
            body: body,
            headers: generateHeader(),
        })
            .then(function (response) {
                status = response.status;
                return response.json();
            })
            .then(function (data) {
                if (responseValidator(status)) resolve({ value: data, status });
                else {
                    handleErrors(data);
                    reject({ data, status });
                }
            })
            .catch((/* err */) => {
                if (status === 401 || status === 403) reject({ data: null, status });
            });
    });
}

// put request
export function _put<R>(url: string, body: any): Promise<Response<R>> {
    let status: number;
    return new Promise((resolve, reject) => {
        fetch(url, {
            method: 'PUT',
            body: JSON.stringify(body),
            headers: generateHeader({ 'Content-Type': 'application/json' }),
        })
            .then(function (response) {
                status = response.status;
                return response.json();
            })
            .then(function (data) {
                if (responseValidator(status)) resolve({ value: data, status });
                else {
                    handleErrors(data);
                    reject({ data, status });
                }
            })
            .catch((/* err */) => {
                if (status === 401 || status === 403) reject({ data: null, status });
            });
    });
}

// patch request
export function _patch<R>(url: string, body: any): Promise<Response<R>> {
    let status: number;
    return new Promise((resolve, reject) => {
        fetch(url, {
            method: 'PATCH',
            body: JSON.stringify(body),
            headers: generateHeader({ 'Content-Type': 'application/json' }),
        })
            .then(function (response) {
                status = response.status;
                return response.json();
            })
            .then(function (data) {
                if (responseValidator(status)) resolve({ value: data, status });
                else {
                    handleErrors(data);
                    reject({ data, status });
                }
            })
            .catch((/* err */) => {
                if (status === 401 || status === 403) reject({ data: null, status });
            });
    });
}

// get request
export function _get<R>(url: string, params: { [k: string]: any } = {}): Promise<Response<R>> {
    const generatedUrl = new URL(url);
    // add query parameters like filters or pagination parameters
    Object.keys(params).forEach((key) => {
        if (!Array.isArray(params[key])) params[key] && generatedUrl.searchParams.append(key, params[key]);
        else {
            params[key].map((item: any) => item && generatedUrl.searchParams.append(key, item));
        }
    });
    let status: number;
    return new Promise((resolve, reject) => {
        fetch(generatedUrl.href, {
            method: 'GET',
            headers: generateHeader({ 'Content-Type': 'application/json' }),
        })
            .then(function (response) {
                status = response.status;
                return response.json();
            })
            .then(function (data) {
                if (responseValidator(status)) resolve({ value: data, status });
                else {
                    handleErrors(data);
                    reject({ data, status });
                }
            })
            .catch((/* err */) => {
                if (status === 401 || status === 403) {
                    authToken.remove();
                    window.location.reload();
                }
                reject({ data: null, status });
            });
    });
}

function responseValidator(status: number): boolean {
    if (status === 401 || status === 403) {
        authToken.remove();
        window.location.reload();
    }

    return status >= 200 && status < 300;
}

export function _upload<R>(
    URL: string,
    formData: any,
    auth = true,
    onProgress?: (progress: number) => void,
): Promise<Response<R>> {
    // let abort: any;
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        // abort = request.abort;
        request.upload.addEventListener('progress', function (e) {
            if (onProgress) onProgress(e.loaded);
        });
        request.open('post', URL);
        request.onload = function () {
            if (request.readyState == XMLHttpRequest.DONE)
                resolve({ status: request.status, value: JSON.parse(request.responseText) });
            else reject({ status: request.status, value: null });
        };
        request.onerror = () => reject({ status: request.status, data: null });
        if (auth) request.setRequestHeader('Authorization', 'Bearer ' + authToken.get());
        request.timeout = 45000;
        request.send(formData);
    });
    // return { promise, abort };
}

export function hasValidationError(status: number) {
    return status == 400;
}

function handleErrors(data: any) {
    if (!responseValidator(data.status) && !data.isSuccess) {
        let message = data.message;

        if (hasValidationError(data.status) && data.errors != null) {
            var validationError = false;
            getValidationErrors(data.errors).map((error) => {
                if (typeof error === 'string') toast.error(error);
                else toast.error(error[0]);
                validationError = true;
            });
            if (!validationError) toast.error(message);
        } else toast.error(message);
    }
}

export function getValidationErrors(errors: any): any[] {
    let list = [];

    for (let key in errors) {
        let value = errors[key];
        list.push(value);
    }

    return list;
}
