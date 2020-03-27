import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import axios, {AxiosRequestConfig} from 'axios'
import {CacheLevel, Cancel, RequestConfig, Response, Status, TransForm} from "./types";
import {buildCacheData, comparisonAny, getItem, getKey, isExpired, logger, setItem} from './utils'
import {options} from './config'

const normalTransform: TransForm<any> = (response => response);

/**
 * 内存缓存数据,加快数据初始化速度
 * @type {Map<string, any>}
 */
const CacheMaps: Map<string, { data: any, expiration: number }> = new Map();

type Tracker = { cancel?: Cancel, count: number }

export function useRequest<M>(axiosRequestConfig: AxiosRequestConfig, requestConfig: RequestConfig<M> = {}): Response<M> {

    const tracker = useRef<Tracker>({
        count: 0,
    });
    const cacheAxiosConfig = useComparisonChange(axiosRequestConfig);
    const cacheRequestConfig = useComparisonChange(requestConfig);
    const cacheKey = useMemo(() => getKey(cacheAxiosConfig, cacheRequestConfig), [cacheAxiosConfig, cacheRequestConfig]);
    const {
        onlyLoadOnce = options.onlyLoadOnce!,
        cancelOnUnmount = options.cancelOnUnmount!,
        initWithCache = options.initWithCache!,
        timer,
        cache = options.cache!,
        expiration = options.expiration!
    } = cacheRequestConfig;


    const [data, setData] = useState<M>();
    const [status, setStatus] = useState<Status>(() => {
        if (initWithCache && CacheMaps.has(cacheKey)) {
            return Status.SUCCESS
        } else {
            return Status.LOADING
        }
    });
    const [error, setError] = useState<Error>();

    const fetchData = useCallback((loading?: boolean) => {
        if (loading) {
            setStatus(Status.LOADING);
        }
        tracker.current.count += 1;
        return fetchResponse(cacheAxiosConfig, cacheRequestConfig, (fn: Cancel) => tracker.current.cancel = fn)
            .then(res => {
                setData(res);
                CacheMaps.set(cacheKey, buildCacheData(res, expiration));
                setStatus(Status.SUCCESS);
                logger('loadData with net', cacheKey);
                if (cache === CacheLevel.STORAGE) {
                    return setItem(cacheKey, res, expiration)
                }
                return res
            })
            .catch(e => {
                setError(e);
                setStatus(Status.ERROR);
                return null
            })
    }, [cache, cacheAxiosConfig, cacheKey, cacheRequestConfig, expiration, setData]);
    const cancel = useCallback((message?: string) => {
        tracker.current.cancel && tracker.current.cancel(message)
    }, []);
    const cancelTimer = useIntervalFn(fetchData, timer);

    useEffect(() => {
        let firstUseCache = initWithCache && CacheMaps.has(cacheKey);
        if (firstUseCache) {
            logger('initData with cache', cacheData);
            setData(CacheMaps.get(cacheKey)?.data);
        }
        const loading = !onlyLoadOnce && tracker.current.count !== 0 && !firstUseCache;
        switch (cache) {
            case CacheLevel.STORAGE:
                getItem(cacheKey).then(res => {
                    //数据不为空表示数据有效，直接设置数据源
                    if (res) {
                        setData(res);
                        setStatus(Status.SUCCESS);
                        logger('loadData with storage', cacheKey);
                        return;
                    }
                    //获取不到数据则进行网络请求数据
                    fetchData(loading)
                });
                break;
            case CacheLevel.MEMORY:
                //如果内存有缓存数据并且没有过期，则设置缓存数据
                if (CacheMaps.has(cacheKey) && !isExpired(CacheMaps.get(cacheKey)!.expiration)) {
                    setData(CacheMaps.get(cacheKey)?.data);
                    setStatus(Status.SUCCESS);
                    logger('loadData with memory', cacheKey);
                    break;
                }
            case CacheLevel.NO:
            default:
                fetchData(loading);
                break;
        }
    }, [onlyLoadOnce, fetchData, initWithCache, cacheKey, cache]);

    useUnmount(() => {
        if (cancelOnUnmount) {
            cancel('Component will unmount!');
        }
    });

    //做一次拦截,深度对比相同时不触发更新
    const cacheData = useComparisonChange(data);
    return {
        data: cacheData,
        refresh: fetchData,
        status,
        error,
        cancel,
        cancelTimer
    }
}


function fetchResponse<M>(axiosRequestConfig: AxiosRequestConfig,
                          requestConfig: RequestConfig<M> = {}, setCancel: (cancel: Cancel) => void) {
    const {
        transform = normalTransform,
    } = requestConfig;

    const source = axios.CancelToken.source();
    setCancel(source.cancel);
    const request = requestConfig.request || options.request;
    return request!({
        cancelToken: source.token,
        ...axiosRequestConfig
    })
        .then(transform)
}


export function useInterval(timer: undefined | number) {
    const _timer = useRef<NodeJS.Timeout | undefined>();
    const [tag, setTag] = useState<number>();
    const cancel = useCallback(() => {
        // @ts-ignore
        clearInterval(_timer.current)
    }, []);
    useEffect(() => {
        if (timer && typeof _timer.current === "undefined") {
            cancel();
            _timer.current = setInterval(() => setTag(Date.now()), timer)
        }
        return () => {
            cancel();
        }
    }, [cancel, timer]);
    return {
        tag,
        cancel
    }
}


export function useIntervalFn(fn: () => void, timer: undefined | number) {
    const {cancel, tag} = useInterval(timer);
    useEffect(() => {
        if (tag) {
            fn();
        }
    }, [fn, tag]);
    return cancel;
}

/**
 * 添加一层缓存判断两次的数据是否相等
 * @param params
 * @returns {M}
 */
export function useComparisonChange<M>(params: M) {
    const cache = useRef<M>();
    const [state, setState] = useState<M>(params);
    useEffect(() => {
        if (!comparisonAny(params, cache.current)) {
            setState(params);
            cache.current = params;
        }
    }, [params]);
    return state
}


function useUnmount(fn: () => void) {
    const fnRef = useRef(fn);
    fnRef.current = fn;
    useEffect(() => {
        return () => {
            fnRef.current()
        }
    }, [])
}
