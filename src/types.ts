import {AxiosInstance, AxiosResponse, AxiosRequestConfig} from 'axios'

type KeyFn = (config: AxiosRequestConfig) => string

export type RequestConfig<M> = {
    defaultData?: M, //默认数据
    key?: string | KeyFn, //指定请求的key值，用于保存数据，如不指定将直接使用序列化请求参数的值
    cache?: CacheLevel, //设置缓存策略 'no'(不缓存)|'memory'(内存缓存)|'storage'(磁盘缓存) 默认storage
    initWithCache?: boolean,//最开始的数据源是否用内存缓存的值 默认true
    expiration?: number | string, // 过期时间 数字类型，单位为毫秒数，例如 5000。字符类型，会通过 ms 转换成毫秒数，例如 5s。
    cancelOnUnmount?: boolean, //组件注销时是否取消网络请求 默认true
    runOnChangeAndMount?: boolean, //组件挂载时或者参数变化是是否立即请求数据 默认true
    timer?: number, // 启动定时刷新数据的定时器
    request?: AxiosInstance, // 设置axios的实例，将会覆盖默认的配置
    transform?: TransForm<M> // 转化数据的钩子
}

export type FilterData<T> = (list: Array<T>, item: T) => boolean;

export type RequestWithPageConfig<T> = {
    filterData?: FilterData<T>
} & RequestConfig<Array<T>>

export type TransForm<M> = (response: AxiosResponse<M> | M | any) => M

export enum Status {
    LOADING = 'loading',
    SUCCESS = 'success',
    ERROR = 'error'
}

export enum CacheLevel {
    NO = 'no',
    MEMORY = 'memory',
    STORAGE = 'storage'
}

export interface ResponseCacheStorage {
    /**
     * Returns the current value associated with the given key, or null if the given key does not exist in the list associated with the object.
     */
    getItem(key: string): Promise<string | null>;

    /**
     * Removes the key/value pair with the given key from the list associated with the object, if a key/value pair with the given key exists.
     */
    removeItem(key: string): Promise<void>;

    /**
     * Sets the value of the pair identified by key to value, creating a new key/value pair if none existed for key previously.
     *
     * Throws a "QuotaExceededError" DOMException exception if the new value couldn't be set. (Setting could fail if, e.g., the user has disabled storage for the site, or if the quota has been exceeded.)
     */
    setItem(key: string, value: string): Promise<void>;

    /**
     * Returns all the keys
     */
    getAllKeys(): Promise<string[]>;
}

export type Cancel = (message?: string) => void

export type Response<M> = {
    /**
     * 请求的数据
     * @param M
     */
    data?: M,
    /**
     * 请求过程中的状态 'loading'(请求中)| 'success'(请求成功)|'error'(请求失败)
     */
    status: Status,
    /**
     * 请求具体的错误
     */
    error?: Error,
    /**
     * 重新加载数据的方法，将直接走网络请求
     */
    refresh: () => Promise<M | null>,
    /**
     * 取消当前请求的方法，要是请求还未完成，请求将中断
     */
    cancel: Cancel,
    /**
     * 当前请求的键值
     */
    key: string | undefined,
    /**
     * 取消定时任务的方法
     */
    cancelTimer: () => void,
    /**
     * 手动调用获取数据的方法
     */
    fetch: () => Promise<M | null>,
}

export type PageResponse<T> = {
    /**
     * 下拉加载中
     */
    isRefreshing: boolean,
    /**
     * 加载更多中
     */
    isLoadingMore: boolean,
    /**
     * 下拉加载的方法
     */
    onRefresh: () => void
    /**
     * 加载更多的方法
     */
    onLoadMore: () => void
} & Response<Array<T>>

/**
 * 默认的配置项
 */
export interface BaseConfig {
    /**
     * 命名空间，此库所有保存的数据将加上这个前缀 默认react-request:
     */
    namespace?: string,
    /**
     * 过期时间 默认'1d'
     */
    expiration?: string,
    /**
     * 缓存策略 默认'storage'
     */
    cache?: CacheLevel,
    /**
     * 初始数据从缓存拿 默认true
     */
    initWithCache?: boolean,
    /**
     * 组件注销时是否取消请求 默认true
     */
    cancelOnUnmount?: boolean,
    /**
     * 组件注销时是否取消请求 默认true
     */
    runOnChangeAndMount?: boolean,
    /**
     * 是否开启日志 默认true(生产模式下请关闭)
     */
    logger?: boolean,
    /**
     * axios实例 默认 axios.create()
     */
    request?: AxiosInstance,
    /**
     * 外存缓存的对象 默认为localStorage react-native 需要传入AsyncStorage
     * ```js
     * configOptions({store: AsyncStorage})
     * ```
     */
    store?: ResponseCacheStorage
}
