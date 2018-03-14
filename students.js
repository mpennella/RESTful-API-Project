// in src/posts.js
import React from 'react';
import { List, Edit, Create, Datagrid, TextField, EditButton, DisabledInput,  SimpleForm, TextInput } from 'admin-on-rest';
export const StudentList = (props) => (
    <List {...props}>
        <Datagrid>
            <TextField source="id" />
            <TextField source = "username" />
            <TextField source="name" />
            <TextField source="_ref" />
	<EditButton />
        </Datagrid>
    </List>
);

const StudentTitle = ({ record }) => {
    return <span>Student {record ? `"${record.username}"` : ''}</span>;
};

export const StudentEdit = (props) => (
    <Edit title={<StudentTitle />} {...props}>
        <SimpleForm>
            <DisabledInput source="id" />
            <TextInput source = "username" />
            <TextInput source="name" />
            <DisabledInput source="_ref" />
        </SimpleForm>
    </Edit>
);

export const StudentCreate = (props) => (
    <Create {...props}>
        <SimpleForm>
            <TextInput source="username" />
            <TextInput source="name" />
        </SimpleForm>
    </Create>
);

