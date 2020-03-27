import React from 'react';
import {Button, View} from 'react-native';
import {getAllCacheKeys, getCacheSize, removeAll} from "react-cache-request";

export default function Setting() {
    return (
        <View style={{marginTop: 30}}>
            <Button title={'getAllCacheKeys'} onPress={() => {
                getAllCacheKeys().then(console.log)
            }}>
            </Button>
            <Button title={'getCacheSize'} onPress={() => {
                getCacheSize().then(console.log)
            }}>
            </Button>
            <Button title={'removeAll'} onPress={() => {
                removeAll().then(console.log)
            }}>
            </Button>
        </View>
    );
}
