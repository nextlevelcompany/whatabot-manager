import classNames from 'classnames';
import { Button } from 'react-bootstrap';
import { ChevronDown, ChevronUp } from 'react-feather';
import HkTooltip from '@/components/@hk-tooltip/HkTooltip';
import { useGlobalStateContext } from '@/context/GolobalStateProvider';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const EditContactHeader = ({ toggleSidebar, show }) => {
    const { states, dispatch } = useGlobalStateContext();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    return (
        <header className="contact-header">
            <div className="d-flex align-items-center">
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb mb-0">
                        <li className="breadcrumb-item">
                            <Link href="/apps/contact/contact-list">
                                Contactos
                            </Link>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">
                            {id ? 'Editar Contacto' : 'Nuevo Contacto'}
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
    )
}

export default EditContactHeader;
