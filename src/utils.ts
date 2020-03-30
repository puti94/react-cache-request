import {options} from './config'
import {AxiosRequestConfig} from "axios";
import ms from "ms";
import {CacheLevel, RequestConfig} from "./types";
import {CacheMaps} from "./fetchResponse";

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

/**
 * 根据配置自动生成key值
 * @param axiosRequestConfig
 * @param requestConfig
 * @returns {string}
 * @protected
 */
export function getKey<M>(axiosRequestConfig: AxiosRequestConfig,
                          requestConfig: RequestConfig<M>): string | undefined {
    const {key, cache, initWithCache} = requestConfig;
    if (key) {
        if (typeof key === 'function') {
            return key(axiosRequestConfig)
        }
        return key;
    }
    if (!initWithCache || cache === CacheLevel.NO) {
        return
    }
    return JSON.stringify(axiosRequestConfig)
}


/**
 * 生成包含命名空间前缀的键值
 * @param key
 * @returns {string}
 */
function appendKey(key: string) {
    return `${options.namespace}${key}`
}

function removeKeyNamespace(key: string) {
    return key.replace(options.namespace!, '')
}

export function buildCacheData(value: any) {
    return {
        time: Date.now(),
        data: value
    }
}

/**
 * 将过期时间转化为数值显示
 * @param t
 * @returns {number}
 */
function formatMs(t: string | number): number {
    if (typeof t === 'number') return t;
    const r = ms(t);
    if (r === undefined) {
        console.error('invalid expiration value');
    }
    return r;
}

/**
 * 判断是否过期
 * @param time  创建时间戳
 * @param expiration 过期时间
 * @returns {boolean}
 * @private
 */
export function isExpired(time: number, expiration: number | string): boolean {
    return Date.now() - (time + formatMs(expiration)) > 0
}

/**
 * 设置缓存数据
 * @param key
 * @param value
 * @returns {Promise<void>}
 */
export function setItem(key: string, value: any) {
    const cacheData = buildCacheData(value);
    logger('setItem', key, cacheData);
    return options.store!.setItem(appendKey(key), JSON.stringify(cacheData))
}

/**
 * 获取缓存数据
 * @param key 键值
 * @param expiration  过期时间
 * @returns {Promise<null>}
 */
export async function getItem(key: string, expiration: number | string) {
    const jsonString = await options.store!.getItem(appendKey(key));
    try {
        if (jsonString != null) {
            const {time, data} = JSON.parse(jsonString);
            if (isExpired(time, expiration)) {
                logger('getItem', key, 'Expired');
                return null
            }
            logger('getItem', key, {time, data, expiration});
            return data
        }
    } catch (e) {
        await removeItem(key);
        return null
    }
}

/**
 * 获取所有缓存的key值
 * @returns {Promise<string[]>}
 */
export async function getAllCacheKeys() {
    const keys = await options.store!.getAllKeys();
    return keys.filter(key => key.startsWith(options.namespace!)).map(removeKeyNamespace)
}

/**
 * 移除所有缓存的数据
 * @returns {Promise<void[]>}
 */
export async function removeAll() {
    const keys = await getAllCacheKeys();
    CacheMaps.clear();
    return Promise.all(keys.map(removeItem))
}

/**
 * 移除指定key值的数据
 * @param key
 * @returns {Promise<void>}
 */
export function removeItem(key: string) {
    logger('removeItem', key);
    CacheMaps.delete(key);
    return options.store!.removeItem(appendKey(key))
}

/**
 * 获取storage缓存的大小
 * @returns {Promise<number>}
 */
export async function getCacheSize(): Promise<number> {
    const keys = await getAllCacheKeys();
    const allCacheData = await Promise.all(keys.map((key) => options.store!.getItem(appendKey(key))));
    return allCacheData.reduce((a, b) => {
        return a + (b?.length || 0);
    }, 0);
}
