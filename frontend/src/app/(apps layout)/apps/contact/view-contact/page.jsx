'use client'
import { useState, Suspense } from 'react';
import classNames from 'classnames';
import ContactAppSidebar from '../ContactAppSidebar';
import ViewContactHeader from './ViewContactHeader';
import ViewContactBody from './ViewContactBody';

const ViewContact = () => {
    const [showSidebar, setShowSidebar] = useState(false);
    const [contactName, setContactName] = useState('');

    return (
        <div className="hk-pg-body py-0">
            <div className={classNames("contactapp-wrap", { "contactapp-sidebar-toggle": showSidebar })}>
                <ContactAppSidebar />
                <div className="contactapp-content">
                    <Suspense fallback={<div className="text-center py-5">Cargando detalles del contacto...</div>}>
                        <div className="contactapp-detail-wrap">
                            <ViewContactHeader toggleSidebar={() => setShowSidebar(!showSidebar)} show={showSidebar} contactName={contactName} />
                            <div className="contact-body px-4 py-2" style={{ overflowY: 'auto' }}>
                                <ViewContactBody setContactName={setContactName} />
                            </div>
                        </div>
                    </Suspense>
                </div>
            </div>
        </div>
    )
}

export default ViewContact;
