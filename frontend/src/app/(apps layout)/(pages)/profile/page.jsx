'use client'
import { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import ProfileIntro from './ProfileIntro';
import Header from './Header';
import Body from './Body';

//Images
import bgImg from '@/assets/img/profile-bg.jpg';
import Image from 'next/image';

const Profile = () => {
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("username") || "admin";
        const fetchProfile = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';
                const res = await fetch(`${apiUrl}/api/auth/profile/${storedUser}`);
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data);
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
            }
        };
        fetchProfile();
    }, []);

    return (
        <div className="hk-pg-body">
            <Container>
                <div className="profile-wrap">
                    <div className="profile-img-wrap">
                        <Image className="img-fluid rounded-5" src={bgImg} alt="Img Description" />
                    </div>
                    <ProfileIntro profile={profile} />
                    <Header />
                    <Body profile={profile} />
                </div>
            </Container>
        </div>
    )
}

export default Profile;