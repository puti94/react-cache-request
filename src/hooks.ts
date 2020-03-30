import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {AxiosRequestConfig} from 'axios'
import {Cancel, FilterData, PageResponse, RequestConfig, RequestWithPageConfig, Response, Status} from "./types";
import {comparisonAny, getKey, logger} from './utils'
import {options} from './config'
import {CacheMaps, fetchResponse, fetchResponseWithNet} from "./fetchResponse";


type Tracker = { cancel?: Cancel, count: number }

/**
 * 封装axios请求的hook，具有缓存管理，状态回调等功能
 * @param axiosRequestConfig
 * @param requestConfig
 * @returns {{cancel: (message?: string) => void; data: M; fetch: () => Promise<M | never>; refresh: () => Promise<M | never>; cancelTimer: () => void; error: Error | undefined; key: string | undefined; status: Status}}
 */
export function useRequest<M>(axiosRequestConfig: AxiosRequestConfig, requestConfig: RequestConfig<M> = {}): Response<M> {

    const tracker = useRef<Tracker>({
        count: 0,
    });
    const cacheAxiosConfig = useComparisonChange(axiosRequestConfig);
    const cacheRequestConfig = useComparisonChange(requestConfig);
    const cacheKey = useMemo(() => getKey(cacheAxiosConfig, cacheRequestConfig), [cacheAxiosConfig, cacheRequestConfig]);
    const {
        cancelOnUnmount = options.cancelOnUnmount!,
        initWithCache = options.initWithCache!,
        timer,
        defaultData,
        runOnChangeAndMount = options.runOnChangeAndMount!,
    } = cacheRequestConfig;


    // @ts-ignore
    const [data, setData] = useState<M>(defaultData);
    const [status, setStatus] = useState<Status>(Status.SUCCESS);
    const [error, setError] = useState<Error>();

    const fetchDataWithNet = useCallback(() => {
        setStatus(Status.LOADING);
        tracker.current.count += 1;
        return fetchResponseWithNet(cacheAxiosConfig, cacheRequestConfig, (fn: Cancel) => tracker.current.cancel = fn, cacheKey)
            .then(res => {
                setData(res);
                setStatus(Status.SUCCESS);
                return res
            })
            .catch(e => {
                setError(e);
                setStatus(Status.ERROR);
                return null
            })
    }, [cacheAxiosConfig, cacheKey, cacheRequestConfig]);

    const fetch = useCallback(() => {
        setStatus(Status.LOADING);
        tracker.current.count += 1;
        if (initWithCache && cacheKey) {
            //只做从内存初始化数据
            if (CacheMaps.has(cacheKey)) {
                logger('initData with cache', cacheData);
                setData(CacheMaps.get(cacheKey)?.data);
            }
        }
        return fetchResponse(cacheAxiosConfig, cacheRequestConfig, (fn: Cancel) => tracker.current.cancel = fn, cacheKey)
            .then(response => {
                setData(response);
                setStatus(Status.SUCCESS);
                return response;
            })
            .catch(e => {
                setStatus(Status.ERROR);
                setError(e);
                return null;
            })
    }, [initWithCache, cacheAxiosConfig, cacheKey]);


    const cancel = useCallback((message?: string) => {
        tracker.current.cancel && tracker.current.cancel(message)
    }, []);
    const cancelTimer = useIntervalFn(fetchDataWithNet, timer);

    useEffect(() => {
        if (!runOnChangeAndMount) return;
        fetch();
    }, [fetch, runOnChangeAndMount]);

    useUnmount(() => {
        if (cancelOnUnmount) {
            cancel('Component will unmount!');
        }
    });

    //做一次拦截,深度对比相同时不触发更新
    const cacheData = useComparisonChange(data);
    return {
        data: cacheData,
        refresh: fetchDataWithNet,
        fetch,
        status,
        error,
        cancel,
        key: cacheKey,
        cancelTimer
    }
}

function handleData<T>(data: Array<T> | undefined, list?: Array<T>, filterData?: FilterData<T>) {
    if (list && filterData) {
        return data!.filter(item => filterData(list, item))
    }
    return data || [];
}


/**
 * 针对分页请求数据需要拼接的一个hook
 * @param getConfig
 * @param requestConfig
 * @returns {Pick<Response<Array<T>>, keyof Response<Array<T>> extends "refresh" | "data" | "status" | "fetch" ? never : keyof Response<Array<T>>> & {onLoadMore: () => void; data: Array<T>; onRefresh: () => void; fetch: () => Promise<Array<T> | null>; isLoadingMore: false | boolean; refresh: () => Promise<Array<T> | null>; isRefreshing: false | boolean; status: Status}}
 */
export function useRequestWithPage<T>(getConfig: (page: number) => AxiosRequestConfig, requestConfig: RequestWithPageConfig<T> = {}): PageResponse<T> {
    const [list, setList] = useState<Array<T>>([]);
    const [page, setPage] = useState<number>(1);
    const config = useMemo(() => getConfig(page), [page, getConfig]);
    const {filterData, ...otherConfig} = requestConfig;
    const {data, status, fetch, refresh, ...other} = useRequest<Array<T>>(config, {
        ...otherConfig,
        initWithCache: false
    });
    const isFirstPage = useMemo(() => page === 1, [page]);
    const isRefreshing = useMemo(() => isFirstPage && status === Status.LOADING, [isFirstPage, status]);
    const isLoadingMore = useMemo(() => !isFirstPage && status === Status.LOADING, [isFirstPage, status]);
    const onLoadMore = useCallback(() => {
        if (status === Status.LOADING) return;
        setPage(t => t + 1);
    }, [status]);
    const onRefresh = useCallback(() => {
        if (status === Status.LOADING) return;
        !isFirstPage ? setPage(1) : refresh();
    }, [status, isFirstPage]);
    useEffect(() => {
        if (isFirstPage) {
            setList(handleData(data))
        } else {
            setList(prevState => prevState.concat(handleData(data, prevState, filterData)))
        }
    }, [data]);
    return {
        ...other,
        status,
        isRefreshing,
        isLoadingMore,
        fetch,
        refresh,
        data: list,
        onLoadMore,
        onRefresh,
    }
}

/**
 * 定时返回一个时间戳的hook
 * @param timer
 * @returns {{cancel: () => void; tag: number | undefined}}
 */
export function useInterval(timer: undefined | number): { tag: number | undefined, cancel: () => void } {
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


/**
 * 定时执行的hook
 * @param fn
 * @param timer
 * @returns {() => void}
 */
export function useIntervalFn(fn: () => void, timer: undefined | number): () => void {
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


/**
 * 组件卸载是的hook
 * @param fn
 */
function useUnmount(fn: () => void) {
    const fnRef = useRef(fn);
    fnRef.current = fn;
    useEffect(() => {
        return () => {
            fnRef.current()
        }
    }, [])
}
