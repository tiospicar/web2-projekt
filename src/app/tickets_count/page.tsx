'use client'
import axios from 'axios';
import React, { useEffect } from 'react'

const AllTickets = () => {
    const [count, setCount] = React.useState(0);

    useEffect(() => {
        getCount();
    }, []);

    async function getCount() {
        try {
            const response = await axios.get('http://localhost:3000/tickets_count/data');
            console.log("Response: ", response);
            setCount(response.data);
        }
        catch (error) {
            console.error("Error getting count: ", error);
        }
    }

    return (
        <div>
            {!count && <p>Loading...</p>}
            {count && <p>Number of generated tickets: {count}</p>}
        </div>
    )
}

export default AllTickets