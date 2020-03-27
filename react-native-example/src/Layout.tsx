import React from 'react';
import {View, ScrollView, Text} from 'react-native';
import {Status} from "react-cache-request";

export default function Layout({status, error, children, title}: { status?: Status, children?: any, error?: Error, title?: string }) {
    return <ScrollView style={{flex:1, backgroundColor: '#eee'}}>
        <View style={{
            height: 45,
            backgroundColor: '#406caa',
            alignItems: 'center'
        }}>
            <Text style={{
                color: 'white', textAlign: 'center', fontWeight: 'bold',
                lineHeight: 45
            }}>{title}</Text>
        </View>
        {status === Status.LOADING && <Text>Loading</Text>}
        {status === Status.ERROR && <Text>错误:{error?.message}</Text>}
        {(!status || status === Status.SUCCESS) && children}
    </ScrollView>
};
