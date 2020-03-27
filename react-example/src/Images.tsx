import React from 'react';
import './App.css';
import {CacheLevel, useRequest} from "react-cache-request";
import Layout from './Layout';

interface Image {
    id: number,
    time: string,
    img: string
}

export default function Images() {
    const {data, status, error} = useRequest<Image[]>({
        url: '/getImages',
        method: 'post',
    }, {expiration: '30m', key: 'getImages', cache: CacheLevel.STORAGE});
    return (
        <Layout status={status} error={error} title={'美图推荐'}>
            {data?.map(item => <NewsItem item={item} key={item.id}/>)}
        </Layout>
    );
}

function NewsItem({item}: { item: Image }) {
    return <div style={{display: 'flex', alignItems: 'center'}}>
        <img style={{width: '100%'}} src={item.img}/>
    </div>
}

