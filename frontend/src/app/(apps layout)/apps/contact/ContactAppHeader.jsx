import Link from 'next/link';
import { Button, Dropdown } from 'react-bootstrap';
import classNames from 'classnames';
import { Archive, ChevronDown, ChevronUp, Edit, ExternalLink, Grid, List, MoreVertical, RefreshCw, Server, Settings, Slash, Star, Trash2, User, MessageSquare } from 'react-feather';
import { usePathname } from 'next/navigation';
import { useGlobalStateContext } from '@/context/GolobalStateProvider';
import HkTooltip from '@/components/@hk-tooltip/HkTooltip';

const ContactAppHeader = ({ toggleSidebar, show, onAddNewContact, viewMode, setViewMode }) => {
    const { states, dispatch } = useGlobalStateContext();
    const pathName = usePathname();
    const contactListRoute = pathName.match("/apps/contact/contact-list");

    return (
        <header className="contact-header">
            <div className="d-flex align-items-center">
                {/* Cabecera simplificada para evitar duplicados */}
            </div>
            <div className="contact-options-wrap">
                <Dropdown className="inline-block" >
                    <Dropdown.Toggle as="a" href="#" className="btn btn-icon btn-flush-dark flush-soft-hover no-caret active">
                        <span className="icon">
                            <span className="feather-icon">
                                {contactListRoute && viewMode === 'map' ? '🗺️' : contactListRoute && viewMode === 'chats' ? <MessageSquare /> : contactListRoute ? <List /> : <Grid />}
                            </span>
                        </span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end">
                        <Dropdown.Item 
                            as={Link} 
                            href="/apps/contact/contact-list" 
                            onClick={() => setViewMode && setViewMode('list')}
                            className={classNames({ "active": contactListRoute && viewMode === 'list' })}
                        >
                            <span className="feather-icon dropdown-icon">
                                <List />
                            </span>
                            <span>List View</span>
                        </Dropdown.Item>
                        {contactListRoute && (
                            <Dropdown.Item 
                                onClick={() => setViewMode && setViewMode('map')} 
                                className={classNames({ "active": viewMode === 'map' })}
                            >
                                <span className="feather-icon dropdown-icon" style={{ fontSize: '1.1rem' }}>
                                    🗺️
                                </span>
                                <span>Map View</span>
                            </Dropdown.Item>
                        )}
                        {contactListRoute && (
                            <Dropdown.Item 
                                onClick={() => setViewMode && setViewMode('chats')} 
                                className={classNames({ "active": viewMode === 'chats' })}
                            >
                                <span className="feather-icon dropdown-icon">
                                    <MessageSquare />
                                </span>
                                <span>Chats en Vivo</span>
                            </Dropdown.Item>
                        )}
                        <Dropdown.Item 
                            as={Link} 
                            href="/apps/contact/contact-cards" 
                            className={classNames({ "active": pathName === "/apps/contact/contact-cards" })}
                        >
                            <span className="feather-icon dropdown-icon">
                                <Grid />
                            </span>
                            <span>Grid View</span>
                        </Dropdown.Item>
                        <Dropdown.Item>
                            <span className="feather-icon dropdown-icon">
                                <Server />
                            </span>
                            <span>Compact View</span>
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
                <Button as="a" variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover no-caret d-sm-inline-block d-none" href="#">
                    <HkTooltip title="Refresh" placement={states.layoutState.topNavCollapse ? "bottom" : "top"} >
                        <span className="icon">
                            <span className="feather-icon">
                                <RefreshCw />
                            </span>
                        </span>
                    </HkTooltip>
                </Button>
                <div className="v-separator d-lg-block d-none" />
                <Dropdown className="inline-block" >
                    <Dropdown.Toggle as="a" href="#" className="btn btn-flush-dark btn-icon btn-rounded flush-soft-hover no-caret d-lg-inline-block d-none ms-sm-0">
                        <HkTooltip placement={states.layoutState.topNavCollapse ? "bottom" : "top"} title="Manage Contact">
                            <span className="icon">
                                <span className="feather-icon">
                                    <Settings />
                                </span>
                            </span>
                        </HkTooltip>
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end">
                        <Dropdown.Item>Manage Contact</Dropdown.Item>
                        <Dropdown.Item>Import</Dropdown.Item>
                        <Dropdown.Item>Export</Dropdown.Item>
                        <div className="dropdown-divider" />
                        <Dropdown.Item>Send Messages</Dropdown.Item>
                        <Dropdown.Item>Delegate Access</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
                <Dropdown className="inline-block ms-1">
                    <Dropdown.Toggle as="a" href="#" className="btn btn-flush-dark btn-icon btn-rounded btn-flush-dark flush-soft-hover no-caret d-lg-inline-block d-none">
                        <HkTooltip placement={states.layoutState.topNavCollapse ? "bottom" : "top"} title="More">
                            <span className="icon">
                                <span className="feather-icon">
                                    <MoreVertical />
                                </span>
                            </span>
                        </HkTooltip>
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end">
                        <Dropdown.Item>
                            <span className="feather-icon dropdown-icon">
                                <Star />
                            </span>
                            <span>Stared Contacts</span>
                        </Dropdown.Item>
                        <Dropdown.Item>
                            <span className="feather-icon dropdown-icon">
                                <Archive />
                            </span>
                            <span>Archive Contacts</span>
                        </Dropdown.Item>
                        <div className="dropdown-divider" />
                        <Dropdown.Item>
                            <span className="feather-icon dropdown-icon">
                                <Slash />
                            </span>
                            <span>Block Content</span>
                        </Dropdown.Item>
                        <Dropdown.Item>
                            <span className="feather-icon dropdown-icon">
                                <ExternalLink />
                            </span>
                            <span>Feedback</span>
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
                <Button as="a" href="#" className="btn-icon btn-flush-dark btn-rounded flush-soft-hover hk-navbar-togglable d-sm-inline-block d-none" onClick={() => dispatch({ type: 'top_nav_toggle' })} >
                    <HkTooltip placement={states.layoutState.topNavCollapse ? "bottom" : "top"} title="Collapse" >
                        <span className="icon">
                            <span className="feather-icon">
                                {
                                    states.layoutState.topNavCollapse ? <ChevronDown /> : <ChevronUp />
                                }
                            </span>
                        </span>
                    </HkTooltip>
                </Button>
            </div>
        </header>
    )
}


export default ContactAppHeader;
