import axios, {AxiosRequestConfig} from "axios";
import {CacheLevel, Cancel, RequestConfig, TransForm} from "./types";
import {options} from "./config";
import {buildCacheData, getItem, getKey, isExpired, logger, setItem} from "./utils";

/**
 * 内存缓存数据,加快数据初始化速度
 * @type {Map<string, any>}
 */
export const CacheMaps: Map<string, { data: any, time: number }> = new Map();
const normalTransform: TransForm<any> = (response => response);

/**
 * 通过cache等级从不同途径获取数据
 * @param axiosRequestConfig
 * @param requestConfig
 * @param callback
 * @returns {Promise<any | M>}
 * @param cacheKey
 */
export async function fetchResponse<M>(
    axiosRequestConfig: AxiosRequestConfig,
    requestConfig: RequestConfig<M> = {},
    callback?: (cancel: Cancel) => void,
    cacheKey?: string
): Promise<M> {
    const {
        cache = options.cache!,
        expiration = options.expiration!,
    } = requestConfig;
    if (!cacheKey) {
        cacheKey = getKey(axiosRequestConfig, requestConfig);
    }

    if (cacheKey && cache === CacheLevel.MEMORY && CacheMaps.has(cacheKey) && !isExpired(CacheMaps.get(cacheKey)!.time,expiration)) {
        logger('loadData with memory', cacheKey);
        return CacheMaps.get(cacheKey)?.data
    }
    if (cacheKey && cache === CacheLevel.STORAGE) {
        const storageCache = await getItem(cacheKey,expiration);
        if (storageCache) {
            logger('loadData with storage', cacheKey);
            return storageCache;
        }
    }
    try {
        return await fetchResponseWithNet(axiosRequestConfig, requestConfig, callback, cacheKey);
    } catch (e) {
        throw e
    }
}

/**
 * 通过网络请求获取数据
 * @param axiosRequestConfig
 * @param requestConfig
 * @param callback
 * @param cacheKey
 * @returns {Promise<AxiosResponse<any> | M>}
 */
export function fetchResponseWithNet<M>(
    axiosRequestConfig: AxiosRequestConfig,
    requestConfig: RequestConfig<M> = {},
    callback?: (cancel: Cancel) => void,
    cacheKey?: string
): Promise<M> {
    const {
        request = options.request,
        transform = normalTransform,
        cache = CacheLevel.NO,
    } = requestConfig;
    const source = axios.CancelToken.source();
    callback && callback(source.cancel);
    if (!cacheKey) {
        cacheKey = getKey(axiosRequestConfig, requestConfig);
    }
    return request!({
        cancelToken: source.token,
        ...axiosRequestConfig
    })
        .then(transform)
        .then(response => {
            logger('loadData with net', cacheKey);
            cacheKey && CacheMaps.set(cacheKey, buildCacheData(response));
            if (cache === CacheLevel.STORAGE) {
                cacheKey && setItem(cacheKey, response)
            }
            return response;
        })
}

