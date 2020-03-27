import {AxiosInstance, AxiosResponse} from 'axios'

export interface RequestConfig<M> {
    defaultData?: M,
    key?: string,
    cache?: CacheLevel,
    initWithCache?: boolean,
    expiration?: number | string,
    onlyLoadOnce?: boolean,
    cancelOnUnmount?: boolean,
    timer?: number,
    request?: AxiosInstance,
    transform?: TransForm<M>
}

export type TransForm<M> = (response: AxiosResponse) => M

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

export interface Response<M> {
    data?: M,
    status: Status,
    error?: Error,
    refresh: (loading?: boolean) => Promise<M | undefined | null>,
    cancel: Cancel,
    cancelTimer: () => void,
}

export interface BaseConfig {
    namespace?: string,
    expiration?: string,
    cache?: CacheLevel,
    initWithCache?: boolean,
    cancelOnUnmount?: boolean,
    onlyLoadOnce?: boolean,
    request?: AxiosInstance,
    store?: ResponseCacheStorage
}
