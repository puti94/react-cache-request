import axios from "axios";

export const request1 = (() => {
    const request = axios.create();
    request.defaults.baseURL = 'https://api.apiopen.top';
    request.defaults.headers['Content-Type'] = 'application/json';
    request.interceptors.response.use(
        response => {
            if (response.data.code === 200) {
                return response.data.result;
            }
            return Promise.reject(new Error(response.data.message));
        },
        error => {
            return Promise.reject(error);
        },
    );
    return request;
})();

export const request2 = (() => {
    const request = axios.create({});
    request.defaults.baseURL = 'https://cnodejs.org/api';
    request.interceptors.response.use(
        response => {
            if (response.data.success) {
                return response.data.data;
            }
            return Promise.reject(new Error(response.data.message));
        },
        error => {
            return Promise.reject(error);
        },
    );
    return request;
})();
