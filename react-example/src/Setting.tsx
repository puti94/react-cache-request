import React, {useState} from 'react';
import './App.css';
import {getAllCacheKeys, getCacheSize, removeAll, fetchResponse, fetchResponseWithNet} from "react-cache-request";
import Layout from './Layout';
import {request2} from "./request";
import {Topic} from "./NewsPage";

const transform: (response: Array<Topic>) => Array<Topic> = (response: Array<Topic>) => response.map(t => ({
    id: t.id,
    create_at: t.create_at,
    title: t.title
}));
export default function Setting() {
    return (
        <Layout title={'接口'}>
            <div>
                <button onClick={() => {
                    getAllCacheKeys().then(console.log)
                }}>getAllCacheKeys
                </button>
                <button onClick={() => {
                    getCacheSize().then(console.log)
                }}>getCacheSize
                </button>
                <button onClick={() => {
                    removeAll().then(console.log)
                }}>removeAll
                </button>
                <button onClick={() => {
                    fetchResponse<Array<Topic>>({
                        url: '/v1/topics',
                        params: {
                            page: 1,
                            limit: 10
                        }
                    }, {
                        request: request2,
                        expiration: '10s',
                        transform: transform
                    }).then(console.log)
                }}>手动获取数据
                </button>
            </div>
        </Layout>
    );
}
