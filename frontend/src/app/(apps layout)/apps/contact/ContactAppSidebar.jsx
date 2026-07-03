import Link from 'next/link';
import { useState } from 'react';
import { Button, Nav } from 'react-bootstrap';
import { Archive, Book, Download, Edit, Inbox, Plus, Printer, Settings, Star, Trash2, Upload } from 'react-feather';
import SimpleBar from 'simplebar-react';
import AddLabel from './AddLabel';
import AddTag from './AddTag';
import CreateNewContact from './CreateNewContact';
import HkBadge from '@/components/@hk-badge/@hk-badge';
import HkTooltip from '@/components/@hk-tooltip/HkTooltip';


const ContactAppSidebar = ({ onCreated, showCreateModal, setShowCreateModal }) => {
    const [addLabels, setAddLabels] = useState(false);
    const [addTags, setAddTags] = useState(false);
    const [localAddNewContact, setLocalAddNewContact] = useState(false);

    const isControlled = showCreateModal !== undefined && setShowCreateModal !== undefined;
    const addNewContact = isControlled ? showCreateModal : localAddNewContact;
    const setAddNewContact = isControlled ? setShowCreateModal : setLocalAddNewContact;

    return (
        <>
            <Nav className="contactapp-sidebar">
                <SimpleBar className="nicescroll-bar">
                    <div className="menu-content-wrap">
                        {/* Contenido removido */}
                    </div>
                </SimpleBar>
                {/*Sidebar Fixnav*/}
                <div className="contactapp-fixednav">
                    <div className="hk-toolbar">
                        <Nav className="nav-light">
                            <Nav.Item className="nav-link">
                                <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover">
                                    <HkTooltip id="tooltip2" placement="top" title="Settings" >
                                        <span className="icon">
                                            <span className="feather-icon">
                                                <Settings />
                                            </span>
                                        </span>
                                    </HkTooltip>
                                </Button>
                            </Nav.Item>
                            <Nav.Item className="nav-link">
                                <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover">
                                    <HkTooltip id="tooltip3" placement="top" title="Archive" >
                                        <span className="icon">
                                            <span className="feather-icon">
                                                <Archive />
                                            </span>
                                        </span>
                                    </HkTooltip>
                                </Button>
                            </Nav.Item>
                            <Nav.Item className="nav-link">
                                <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover">
                                    <HkTooltip id="tooltip2" placement="top" title="Help" >
                                        <span className="icon">
                                            <span className="feather-icon">
                                                <Book />
                                            </span>
                                        </span>
                                    </HkTooltip>
                                </Button>
                            </Nav.Item>
                        </Nav>
                    </div>
                </div>
                {/*/ Sidebar Fixnav*/}
            </Nav>
            {/* Create New Contact */}
            <CreateNewContact show={addNewContact} close={() => setAddNewContact(!addNewContact)} onCreated={onCreated} />
            {/* Add Label */}
            <AddLabel show={addLabels} hide={() => setAddLabels(!addLabels)} />
            {/* Add Tag */}
            <AddTag show={addTags} hide={() => setAddTags(!addTags)} />
        </>
    )
}

export default ContactAppSidebar
