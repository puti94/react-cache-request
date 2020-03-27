import React from 'react';
import {View} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import axios from "axios";
import {configOptions, ResponseCacheStorage} from "react-cache-request";
import NewsPage from "./src/NewsPage";
import Images from "./src/Images";
import Setting from "./src/Setting";

const request = axios.create();

class Storage implements ResponseCacheStorage {
    getAllKeys(): Promise<string[]> {
        return AsyncStorage.getAllKeys();
    }

    getItem(key: string): Promise<string | null> {
        return AsyncStorage.getItem(key);
    }

    removeItem(key: string): Promise<void> {
        return AsyncStorage.removeItem(key);
    }

    setItem(key: string, value: string): Promise<void> {
        return AsyncStorage.setItem(key, value);
    }
}

configOptions({request, store: new Storage()});
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


function App() {
    return (
        <View style={{flex: 1}}>
            <Setting/>
            <NewsPage/>
            <Images/>
        </View>
    );
}


export default App;
