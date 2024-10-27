'use client'
import axios from "axios";
import { useEffect, useState } from "react";

export default function Home() {
    const [accessToken, setAccessToken] = useState('');
    const [qrCode, setQrCode] = useState('');

    useEffect(() => {
        if (!accessToken) {
            console.log("Getting access token");
            getAcessToken();
        }  
        else {
            console.log("Access token already exists");
        }
    }, []);

    async function getAcessToken(){
        try {
            const response = await axios.post('https://dev-vvabkcp1b4m6r582.eu.auth0.com/oauth/token', {
                client_id: 'HDXWKM90jUOHiBbCp1jlazrGQ11mPWhD',
                client_secret: 't3TVIHmgqLRj4vBiBXRwk8HSwF7Ni9FmVbJ5HM7M06UEVZR-Cpx17YrZOKwQ_wEF',
                grant_type: 'client_credentials',
                audience: 'https://dev-vvabkcp1b4m6r582.eu.auth0.com/api/v2/',
                headers: {
                    'content-type': 'application/json'
                }
            });
    
            setAccessToken(response.data.access_token);
            console.log("Access token successfully retrieved");
        }
        catch (error) {
            console.error(error);
        }
    }

    async function generateTicket(formData: FormData){
        if (!accessToken) {
            console.error("Access token is missing");
            return;
        }
        const oib = formData.get('oib');
        const firstname = formData.get('firstname');
        const lastname = formData.get('lastname');

        console.log(oib, firstname, lastname);

        try {
            const response = await axios.post('http://localhost:3000/generate-ticket', {
                "oib": oib,
                "firstName": firstname,
                "lastName": lastname
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,  // Attach the access token
                    'Content-Type': 'application/json'
                }
            });

            const base64string = btoa(
                String.fromCharCode(...response.data['data'])
            );

            const url = `data:image/png;base64,${base64string}`;
            console.log("QR Code URL: ", url);
            setQrCode(url);
        }
        catch (error: any) {
            if (error.status === 400) {
                alert("Maximum number of tickets reached for current OIB!");
            }
        }
    }

    return (
        <div className="flex flex-col">
            {/*<div>
                <button onClick={getAcessToken} className="bg-black text-white px-5 py-2 rounded mt-10 ml-10">Get Access Token</button>
            </div>*/}
            <div>
                <form className="ml-10" action={generateTicket}>
                    <div className="flex mt-5">
                        <input name="oib" type="text" placeholder="OIB" className="border-2 border-black px-5 py-2 rounded" />
                    </div>
                    <div className="flex mt-5">
                        <input name="firstname" type="text" placeholder="Firstname" className="border-2 border-black px-5 py-2 rounded" />
                    </div>
                    <div className="flex mt-5">
                        <input name="lastname" type="text" placeholder="Lastname" className="border-2 border-black px-5 py-2 rounded" />
                    </div>
                    <div className="flex mt-5">
                        <button type="submit" className="bg-black text-white px-5 py-2 rounded">Generate ticket</button>
                    </div>
                </form>
            </div>
            <div>
                {qrCode && <img src={qrCode} alt="QR Code" />}
            </div>
        </div>
    );
}
