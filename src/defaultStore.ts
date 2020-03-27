import {ResponseCacheStorage} from "./types";

const localStorage = typeof window === 'undefined' ? null : window.localStorage;

export default class DefaultStore implements ResponseCacheStorage {
    async getItem(key: string): Promise<string | null> {
        return localStorage?.getItem(key) || null;
    }

    async removeItem(key: string): Promise<void> {
        localStorage?.removeItem(key);
    }

    async setItem(key: string, value: string): Promise<void> {
        localStorage?.setItem(key, value)
    }

    async getAllKeys(): Promise<string[]> {
        return new Array(localStorage?.length)
            .fill('')
            .map((_, index) => localStorage?.key(index) || '')
    }
}

