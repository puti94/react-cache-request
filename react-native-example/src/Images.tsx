import React, {useEffect, useState} from 'react';
import {Image as ImageView, Dimensions} from 'react-native';
import {CacheLevel, useRequest} from "react-cache-request";
import Layout from './Layout';

interface Image {
    id: number,
    time: string,
    img: string
}

const screenWidth = Math.round(Dimensions.get('window').width);

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
    const {width, height} = useImageSize(item.img);
    return <ImageView style={{width: '100%', height: width === 0 ? 0 : screenWidth / width * height}}
                      resizeMode={'contain'}
                      source={{uri: item.img}}/>
}

function useImageSize(url: string) {
    const [size, setSize] = useState({width: 0, height: 0});
    useEffect(() => {
        ImageView.getSize(url, (width, height) => {
            setSize({width, height})
        }, () => {
            console.log('错误')
        })
    }, [url])
    return size
}
