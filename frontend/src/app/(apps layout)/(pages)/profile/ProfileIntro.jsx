import Image from 'next/image';
import Link from 'next/link';
import { Card } from 'react-bootstrap';
import HkBadge from '@/components/@hk-badge/@hk-badge';
import HkTooltip from '@/components/@hk-tooltip/HkTooltip';

//Image 
import avatar3 from '@/assets/img/avatar3.jpg';

const ProfileIntro = ({ profile }) => {
    const fullName = profile && (profile.firstName || profile.lastName)
        ? `${profile.firstName} ${profile.lastName}`.trim()
        : "Kate Jones";
        
    const bioText = profile && profile.bio ? profile.bio : "Venenatis tellus in metus vulputate";
    const locationText = profile && profile.location ? profile.location : "San Francisco, US";
    const websiteText = profile && profile.website ? profile.website : "hencework.com";
    const avatarSrc = profile && profile.avatar ? profile.avatar : avatar3.src;

    return (
        <div className="profile-intro">
            <Card className="card-flush mw-400p bg-transparent">
                <Card.Body>
                    <div className="d-flex align-items-start justify-content-between">
                        <div className="avatar avatar-xxl avatar-rounded position-relative mb-2">
                            <img src={avatarSrc} alt="user" className="avatar-img border border-4 border-white" style={{ objectFit: 'cover', width: '100%', height: '100%', borderRadius: '50%' }} />
                            <HkBadge bg="success" indicator className="badge-indicator-xl position-bottom-end-overflow-1 me-1" />
                        </div>
                        <Link href="/profile/edit-profile" className="btn btn-outline-primary btn-sm rounded-pill px-3 mt-2">
                            <i className="bi bi-pencil me-1" /> Editar Perfil
                        </Link>
                    </div>
                    <h4>{fullName}
                        <HkTooltip title="Top endorsed" placement="top" >
                            <i className="bi-check-circle-fill fs-6 text-blue ms-1" />
                        </HkTooltip>
                    </h4>
                    <p>
                        {bioText}
                    </p>
                    <ul className="list-inline fs-7 mt-2 mb-0">
                        <li className="list-inline-item d-sm-inline-block d-block mb-sm-0 mb-1 me-3">
                            <i className="bi bi-briefcase me-1" />
                            <a href={websiteText.startsWith("http") ? websiteText : `https://${websiteText}`} target="_blank" rel="noreferrer">{websiteText}</a>
                        </li>
                        <li className="list-inline-item d-sm-inline-block d-block mb-sm-0 mb-1 me-3">
                            <i className="bi bi-geo-alt me-1" />
                            <a href="#">{locationText}</a>
                        </li>
                    </ul>
                </Card.Body>
            </Card>
        </div>
    )
}

export default ProfileIntro;
