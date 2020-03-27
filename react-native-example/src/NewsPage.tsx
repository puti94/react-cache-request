import React, {useState} from 'react';
import axios from 'axios';
import {View, Button, Text} from 'react-native';
import {useRequest, CacheLevel} from "react-cache-request";
import Layout from './Layout';

interface Topic {
    id: string,
    title: string,
    create_at: string,
    content: string
}

const request = axios.create();

request.interceptors.response.use(
    response => {
        if (response.data.success) {
            return response.data.data;
        }
        return Promise.reject(new Error(response.data.message));
    },
    error => {
        return Promise.reject(error);
    },
);

export default function NewsPage() {
    const [page, setPage] = useState(1);
    const {data, status, error} = useRequest<Topic[]>({
        url: 'https://cnodejs.org/api/v1/topics',
        baseURL: '',
        params: {
            page: page,
            limit: 10
        }
    }, {cache: CacheLevel.STORAGE, request: request});
    return (
        <Layout status={status} error={error} title={'CNODE首页'}>
            <View>
                <Text>当前页{page}</Text>
                <Button title={'上一页'} onPress={() => setPage(page === 1 ? 1 : page - 1)}/>
                <Button title={'下一页'} onPress={() => setPage(page + 1)}/>
            </View>
            {data?.map(item => <NewsItem item={item} key={item.id}/>)}
        </Layout>
    );
}

function NewsItem({item}: { item: Topic }) {
    return <View style={{display: 'flex', alignItems: 'center', flexDirection: 'row'}}>
        <View style={{marginLeft: 30}}>
            <Text style={{textAlign: 'left', fontSize: 12}}>{item.title}</Text>
            <Text style={{textAlign: 'left', fontSize: 12}}>{item.create_at}</Text>
        </View>
    </View>
}

