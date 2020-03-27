import React from 'react';
import './App.css';
import axios from "axios";
import {configOptions} from "react-cache-request";
import NewsPage from "./NewsPage";
import Images from "./Images";
import Setting from "./Setting";

const request = axios.create();
configOptions({request});
request.defaults.baseURL = 'https://api.apiopen.top';
request.defaults.headers['Content-Type'] = 'application/json';

request.interceptors.request.use(
    config => {
        return config;
    },
    error => {
        // Do something with request error
        return Promise.reject(error);
    },
);
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


function App() {
    return (
        <div className="App">
            <Setting/>
            <NewsPage/>
            <Images/>
        </div>
    );
}


export default App;
