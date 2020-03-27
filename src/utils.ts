import {options} from './config'
import {AxiosRequestConfig} from "axios";
import ms from "ms";
import {RequestConfig} from "./types";

export function logger(message?: any, ...optionalParams: any[]) {
    if (options.logger) {
        console.log('react-cache-request:' + message, ...optionalParams)
    }
}


function getType(data: any) {
    return Object.prototype.toString.call(data).substring(8).split(/]/)[0]
}

/**
 * 对比两个对象是否一致
 * @param sourceObj
 * @param compareObj
 * @returns {boolean}
 */
export function comparisonAny(sourceObj: any, compareObj: any) {
    if (arguments.length < 2) throw "Incorrect number of parameters";
    let sourceType = getType(sourceObj);
    if (sourceType !== getType(compareObj)) return false;
    // Not objects and arrays
    if (sourceType !== "Array" && sourceType !== "Object" && sourceType !== "Set" && sourceType !== "Map") {
        if (sourceType === "Number" && sourceObj.toString() === "NaN") {
            return compareObj.toString() === "NaN"
        }
        if (sourceType === "Date" || sourceType === "RegExp") {
            return sourceObj.toString() === compareObj.toString()
        }
        return sourceObj === compareObj
    } else if (sourceType === "Array") {
        if (sourceObj.length !== compareObj.length) return false;
        if (sourceObj.length === 0) return true;
        for (let i = 0; i < sourceObj.length; i++) {
            if (!comparisonAny(sourceObj[i], compareObj[i])) return false;
        }
    } else if (sourceType === "Object") {
        let sourceKeyList = Reflect.ownKeys(sourceObj);
        let compareKeyList = Reflect.ownKeys(compareObj);
        let key;
        if (sourceKeyList.length !== compareKeyList.length) return false;
        for (let i = 0; i < sourceKeyList.length; i++) {
            key = sourceKeyList[i];
            if (key !== compareKeyList[i]) return false;
            if (!comparisonAny(sourceObj[key], compareObj[key])) return false;
        }
    } else if (sourceType === "Set" || sourceType === "Map") {
        // 把 Set Map 转为 Array
        if (!comparisonAny(Array.from(sourceObj), Array.from(compareObj))) return false;
    }
    return true;
}

export function getKey<M>(axiosRequestConfig: AxiosRequestConfig,
                          requestConfig: RequestConfig<M>): string {
    if (requestConfig.key) return requestConfig.key;
    return JSON.stringify(axiosRequestConfig)
}


function appendKey(key: string) {
    return `${options.namespace}${key}`
}

function removeKeyNamespace(key: string) {
    return key.replace(options.namespace!, '')
}

export function buildCacheData(value: any, expiration: number | string) {
    return {
        expiration: getExpiration(expiration),
        data: value
    }
}

function formatMs(t: string | number) {
    if (typeof t === 'number') return t;
    const r = ms(t);
    if (r === undefined) {
        console.error('invalid expiration value');
    }
    return r;
}

export function getExpiration(expiration: number | string) {
    return Date.now() + formatMs(expiration)
}

export function isExpired(expiration: number) {
    return Date.now() > expiration
}

export function setItem(key: string, value: any, expiration: number | string) {
    const cacheData = buildCacheData(value, expiration);
    logger('setItem', key, cacheData);
    return options.store!.setItem(appendKey(key), JSON.stringify(cacheData))
}

export async function getItem(key: string) {
    const jsonString = await options.store!.getItem(appendKey(key));
    try {
        if (jsonString != null) {
            const {expiration, data} = JSON.parse(jsonString);
            if (isExpired(expiration)) {
                logger('getItem', key, 'isExpired');
                return null
            }
            logger('getItem', key, {expiration, data});
            return data
        }
    } catch (e) {
        await removeItem(key);
        return null
    }
}

export async function getAllCacheKeys() {
    const keys = await options.store!.getAllKeys();
    return keys.filter(key => key.startsWith(options.namespace!)).map(removeKeyNamespace)
}

export async function removeAll() {
    const keys = await getAllCacheKeys();
    return Promise.all(keys.map(removeItem))
}

export function removeItem(key: string) {
    logger('removeItem', key);
    return options.store!.removeItem(appendKey(key))
}

export async function getCacheSize(): Promise<number> {
    const keys = await getAllCacheKeys();
    const allCacheData = await Promise.all(keys.map((key) => options.store!.getItem(appendKey(key))));
    return allCacheData.reduce((a, b) => {
        return a + (b?.length || 0);
    }, 0);
}
