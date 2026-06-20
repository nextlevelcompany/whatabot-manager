import classNames from 'classnames';
import { Button } from 'react-bootstrap';
import { ChevronDown, ChevronUp } from 'react-feather';
import HkTooltip from '@/components/@hk-tooltip/HkTooltip';
import { useGlobalStateContext } from '@/context/GolobalStateProvider';
import Link from 'next/link';

const ViewContactHeader = ({ toggleSidebar, show, contactName }) => {
    const { states, dispatch } = useGlobalStateContext();

    return (
        <header className="contact-header">
            <div className="d-flex align-items-center justify-content-between w-100 me-3">
                <h4 className="fw-bold text-dark mb-0" style={{ fontSize: '1.25rem' }}>Ficha de Contacto</h4>
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb mb-0" style={{ fontSize: '0.85rem' }}>
                        <li className="breadcrumb-item">
                            <Link href="/apps/contact/contact-list">
                                Contactos
                            </Link>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">
                            {contactName || 'Detalle de Contacto'}
                        </li>
                    </ol>
                </nav>
            </div>
            <div className="contact-options-wrap">
                <Button as="a" variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover hk-navbar-togglable" onClick={() => dispatch({ type: "top_nav_toggle" })} >
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
            <div className={classNames("hk-sidebar-togglable", { "active": show })} onClick={toggleSidebar} />
        </header>
    );
};

export default ViewContactHeader;
