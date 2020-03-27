import {BaseConfig, CacheLevel} from "./types";
import DefaultStore from "./defaultStore";
import axios from 'axios'

export let options: BaseConfig = {
    namespace: 'react-request:',
    expiration: '1d',
    initWithCache: true,
    cache: CacheLevel.STORAGE,
    onlyLoadOnce: true,
    request: axios.create(),
    store: new DefaultStore()
};

export function configOptions(params: BaseConfig) {
    Object.assign(options, params)
}
