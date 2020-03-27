import React, {useState} from 'react';
import './App.css';
import {useRequest, CacheLevel} from "react-cache-request";
import Layout from './Layout';

interface News {
    path: string,
    image: string,
    title: string,
    passtime: string
}

export default function NewsPage() {
    const [page, setPage] = useState(1);
    const {data, status, error} = useRequest<News[]>({
        url: '/getWangYiNews',
        method: 'post',
        data: {
            page: page
        }
    }, {cache: CacheLevel.NO});
    return (
        <Layout status={status} error={error} title={'网易新闻'}>
            <div>
                <span>当前页{page}</span>
                <button onClick={() => setPage(page === 1 ? 1 : page - 1)}>上一页</button>
                <button onClick={() => setPage(page + 1)}>下一页</button>
            </div>
            {data?.map(item => <NewsItem item={item} key={item.title}/>)}
        </Layout>
    );
}

function NewsItem({item}: { item: News }) {
    return <a key={item.path} href={item.path} style={{display: 'flex', alignItems: 'center'}} target='_blank'>
        <img src={item.image} style={{width: 70, height: 44}}/>
        <div style={{marginLeft: 30}}>
            <p style={{textAlign: 'left', fontSize: 12}}>{item.title}</p>
            <p style={{textAlign: 'left', fontSize: 12}}>{item.passtime}</p>
        </div>
    </a>
}

