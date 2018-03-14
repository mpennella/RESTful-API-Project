// in src/App.js
import React from 'react';
import { jsonServerRestClient, Admin, Resource, Delete, fetchUtils } from 'admin-on-rest';
import authClient from './authClient';
import { StudentList, StudentEdit, StudentCreate } from './students';
import { GradeList, GradeEdit, GradeCreate } from './grades';

const httpClient = (url, options = {}) => {
    if (!options.headers) {
        options.headers = new Headers({ Accept: 'application/json' });
    }
    const token = localStorage.getItem('token');
    options.headers.set('Authorization', `Basic ${token}`);
    return fetchUtils.fetchJson(url, options);
}

const App = () => (
    <Admin authClient={authClient} restClient={jsonServerRestClient('http://54.191.5.230:3001', httpClient)}>
         <Resource name="students" list={StudentList} edit={StudentEdit} create={StudentCreate} remove={Delete}/>
   	 <Resource name= "grades" list={GradeList} edit={GradeEdit} create={GradeCreate} remove={Delete}/>
    </Admin>
);

export default App;
