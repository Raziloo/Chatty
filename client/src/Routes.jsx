import RegisterAndLoginForm from "./RegisterAndLoginForm";
import React, { useContext } from 'react'
import { UserContext } from './UserContext.jsx';
import Chat from "./Chat";

export default function Routes() {
    const {username, id} = useContext(UserContext);

    if (username) {
        return <Chat />
    };

    return (
        <RegisterAndLoginForm />
    );
}