import React from 'react';
import {Status} from "react-cache-request";

export default function Layout({status, error, children, title}: { status?: Status, children?: any, error?: Error, title?: string }) {
    return <div style={{width: 375, height: 667, overflowY: "auto", background: '#eee', margin: 20}}>
        <div style={{
            height: 45,
            background: '#406caa',
            color: 'white',
            textAlign: 'center',
            fontWeight: 'bold',
            lineHeight: '45px'
        }}>
            {title}
        </div>
        {status === Status.LOADING && <h1>Loading</h1>}
        {status === Status.ERROR && <h1>错误:{error?.message}</h1>}
        {(!status || status === Status.SUCCESS) && children}
    </div>
};
