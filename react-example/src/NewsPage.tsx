import React, {useMemo, useState, useRef} from 'react';
import './App.css';
import {useRequest, CacheLevel, useRequestWithPage} from "react-cache-request";
import Layout from './Layout';
import {request2} from "./request";
import {AxiosRequestConfig} from 'axios'

export interface Topic {
    id: string,
    title: string,
    create_at: string,
    content?: string
}

export default function NewsPage() {
    const [page, setPage] = useState(1);
    const config = useMemo(() => getConfig(page), [page])
    const {data, status, error} = useRequest<Topic[]>(config, {cache: CacheLevel.STORAGE, request: request2});
    return (
        <Layout status={status} error={error} title={'CNODE首页'}>
            <div>
                <span>当前页{page}</span>
                <button onClick={() => setPage(page === 1 ? 1 : page - 1)}>上一页</button>
                <button onClick={() => setPage(page + 1)}>下一页</button>
            </div>
            {data?.map(item => <NewsItem item={item} key={item.id}/>)}
        </Layout>
    );
}

const NewsItem = React.memo(function NewsItem({item}: { item: Topic }) {
    console.log('渲染')
    return <div key={item.id} style={{display: 'flex', alignItems: 'center'}}>
        <div style={{marginLeft: 30}}>
            <p style={{textAlign: 'left', fontSize: 12}}>{item.title}</p>
            <p style={{textAlign: 'left', fontSize: 12}}>{item.create_at}</p>
        </div>
    </div>
}, (prevProps, nextProps) => prevProps.item.id === nextProps.item.id);

function getConfig(page: number) {
    return {
        url: '/v1/topics',
        params: {
            page: page,
            limit: 10
        }
    }
}

const requestConfig = {
    request: request2,
    filterData: ((list: Array<Topic>, item: Topic) => list.length === 0 || list.findIndex(t => t.id === item.id) < 0),
    expiration: '20s',
    cache: CacheLevel.NO
}

export function WithPage() {
    const {data, isLoadingMore, isRefreshing, onRefresh, onLoadMore} = useRequestWithPage<Topic>(getConfig, requestConfig);

    return (
        <Layout title={'CNODE首页'}>
            <div>
                {isRefreshing ? <p>刷新中</p> : <button onClick={() => onRefresh()}>下拉刷新</button>}
            </div>
            {data?.map(item => <NewsItem item={item} key={item.id}/>)}
            <div>
                {isLoadingMore ? <p>刷新中</p> : <button onClick={() => onLoadMore()}>加载更多</button>}
            </div>
        </Layout>
    );
}
