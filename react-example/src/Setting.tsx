import React, {useState} from 'react';
import './App.css';
import {getAllCacheKeys, getCacheSize,removeAll} from "react-cache-request";
import Layout from './Layout';

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
            </div>
        </Layout>
    );
}
