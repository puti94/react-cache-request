# react-cache-request

一个使用axios进行网络请求的hook函数，具备内存，磁盘缓存功能。支持react,react-native

## Getting Started


### Install

```
$ yarn add react-cache-request axios
```

## Usage

### Import

```js
import {useRequest} from 'react-cache-request';
```

### Simple use
```jsx

 const {data, status, error} = useRequest({url: 'https://cnodejs.org/api/v1/topics'})

```

### Docs

[文档](https://puti94.github.io/react-cache-request/)

### Example
项目中有react和react-native的示例
### Issue

觉得不错的小手一点，给个star，有遇到什么bug或者有什么建议的欢迎提issue

## License

MIT
