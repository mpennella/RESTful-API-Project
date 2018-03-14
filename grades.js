import React from 'react';
import { List, Edit, Create, Datagrid, TextField, EditButton, DisabledInput,  SimpleForm, TextInput} from 'admin-on-rest';
export const GradeList = (props) => (
    <List {...props}>
        <Datagrid>
            <TextField source="id" />
            <TextField source = "username" />
            <TextField source="type" />
	    <TextField source="max" />
	    <TextField source="grade" />
        <EditButton />
        </Datagrid>
    </List>
);

const GradeTitle = ({ record }) => {
    return <span>Grade {record ? `"${record.id}"` : ''}</span>;
};

export const GradeEdit = (props) => (
    <Edit title={<GradeTitle />} {...props}>
        <SimpleForm>
            <DisabledInput source="id" />
            <TextInput source = "username" />
            <TextInput source="type" />
	    <TextInput source="max" />
	    <TextInput source="grade" />
        </SimpleForm>
    </Edit>
);

export const GradeCreate = (props) => (
    <Create {...props}>
        <SimpleForm>
            <TextInput source="username" />
            <TextInput source="type" />
	    <TextInput source="max" />
	    <TextInput source="grade" />
        </SimpleForm>
    </Create>
);
