'use client'
import { useState, Suspense } from 'react';
import classNames from 'classnames';
import ContactAppSidebar from '../ContactAppSidebar';
import EditContactForm from '../edit-contact/EditContactForm';
import EditContactHeader from '../edit-contact/EditContactHeader';

const CreateContact = () => {
    const [showSidebar, setShowSidebar] = useState(false);

    return (
        <div className="hk-pg-body py-0">
            <div className={classNames("contactapp-wrap", { "contactapp-sidebar-toggle": showSidebar })}>
                <ContactAppSidebar />
                <div className="contactapp-content">
                    <Suspense fallback={<div className="text-center py-5">Cargando formulario...</div>}>
                        <div className="contactapp-detail-wrap">
                            <EditContactHeader toggleSidebar={() => setShowSidebar(!showSidebar)} show={showSidebar} />
                            <div className="contact-body px-4 py-2" style={{ overflowY: 'auto' }}>
                                <EditContactForm />
                            </div>
                        </div>
                    </Suspense>
                </div>
            </div>
        </div>
    )
}

export default CreateContact;
