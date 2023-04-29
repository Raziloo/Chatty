import React, { useContext, useState } from 'react'
import axios from 'axios';
import { UserContext } from './UserContext.jsx';

export default function RegisterAndLoginForm() {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoginOrRegister, setIsLoginOrRegister] = useState('Login');
    const {setUsername:setLoggedInUsername, setId} = useContext(UserContext);

    async function handleSubmit(event) {
        event.preventDefault();
        const url = isLoginOrRegister === 'Register' ? '/register' : '/login';
         const {data} = await axios.post(url , {username,password});
         setLoggedInUsername(username);
        setId(data.id);
    }


    return (
        <div className="bg-blue-50 h-screen flex items-center">
            <form onSubmit={handleSubmit} className="w-64 mx-auto mb-20">
            <input value={username} onChange={ event => setUsername(event.target.value)} type="text" placeholder="Username" className="block w-full rounded-sm p-2 mb-2 border"/>
            <input value={password} onChange={ event => setPassword(event.target.value)} type="password" placeholder="Password" className="block w-full rounded-sm p-2 mb-2 border"/>
            <button className="bg-blue-500 text-white block w-full rounded-sm p-2">{isLoginOrRegister === 'Register' ? 'Register' : 'Login'}</button>

                {isLoginOrRegister === 'Register' && (
                                <div>Already a member?  
                                     <button onClick={() => setIsLoginOrRegister('Login')} > login here
                                     </button>
                                     </div>
                )}
                                {isLoginOrRegister === 'Login' && (
                                <div>Already a member?
                                     <button onClick={() => setIsLoginOrRegister('Register')} > Register here
                                     </button>
                                     </div>
                )}

            </form>
        </div>
    )
}