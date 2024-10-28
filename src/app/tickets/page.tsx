'use client'
import axios from 'axios';
import React, { useEffect } from 'react'

const Tickets = () => {
    const [oib, setOib] = React.useState('');
    const [firstname, setFirstname] = React.useState('');
    const [lastname, setLastname] = React.useState('');
    const [username, setUsername] = React.useState('');

    useEffect(() => {
        const queryString = window.location.search;
        const id = new URLSearchParams(queryString).get('id');

        if (id) {
            getTicket(id);
        }

        getUser();
    }, []);

    async function getTicket(id: string) {
        try {
            const response = await axios.get(`https://web2-projekt.onrender.com/tickets/${id}/data`);
            setOib(response.data.oib);
            setFirstname(response.data.first_name);
            setLastname(response.data.last_name);
        }
        catch (error) {
            console.error("Error generating ticket: ", error);
        }
    }

    async function getUser(){
        try {
            const response = await axios.get(`https://web2-projekt.onrender.com/me`);
            setUsername(response.data.name);
        }
        catch (error) {
            console.error("Error getting user: ", error);
        }
    }

    return (
        <div>
            <h1>Tickets</h1>
            {!oib && <p>Loading...</p>}
            {oib &&
                <div>
                    <p>OIB: {oib}</p>
                    <p>Firstname: {firstname}</p>
                    <p>Lastname: {lastname}</p>
                </div>
            }
            {username && 
                <div className='flex mt-10'>
                    <p>Logged in as: {username}</p>
                </div>
            }
        </div>
    )
}
export default Tickets