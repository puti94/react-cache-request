import React from 'react';
import './App.css';
import {configOptions} from "react-cache-request";
import NewsPage, {WithPage} from "./NewsPage";
import Images from "./Images";
import Setting from "./Setting";
import {request1} from "./request";

configOptions({request: request1});


function App() {
    return (
        <div className="App">
            <Setting/>
            {/*<NewsPage/>*/}
            <WithPage/>
            {/*<Images/>*/}
        </div>
    );
}


export default App;
