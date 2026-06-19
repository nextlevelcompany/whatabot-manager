import { ArrowBarToLeft } from 'tabler-icons-react';
import { Button } from 'react-bootstrap';
import Link from 'next/link';
import Image from 'next/image';
import { useGlobalStateContext } from '@/context/GolobalStateProvider';
//Images
import logo from '@/assets/img/nextlead-icon.png';
import jampackImg from '@/assets/img/nextlead-logo.svg';
import jampackImgDark from '@/assets/img/nextlead-logo.svg';
import { useTheme } from '../theme-provider/theme-provider';


const SidebarHeader = () => {
    const { states, dispatch } = useGlobalStateContext();
    const { theme } = useTheme();

    const toggleSidebar = () => {
        dispatch({ type: 'sidebar_toggle' });
    }

    return (
        <div className="menu-header">
            <span>
                <Link className="navbar-brand" href="/">
                    {/* Icono pequeño para estado colapsado */}
                    <Image className="brand-img img-fluid brand-icon-only" src={logo} alt="brand" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />

                    {/* Logo completo para estado expandido */}
                    {theme === "light" ? (
                        <Image className="brand-img img-fluid logo-light" src={jampackImg} alt="brand" style={{ height: '80px', width: 'auto', objectFit: 'contain' }} />
                    ) : (
                        <Image className="brand-img img-fluid logo-dark" src={jampackImgDark} alt="brand" style={{ height: '80px', width: 'auto', objectFit: 'contain' }} />
                    )}

                </Link>
                <Button variant="flush-dark" onClick={toggleSidebar} className="btn-icon btn-rounded flush-soft-hover navbar-toggle">
                    <span className="icon">
                        <span className="svg-icon fs-5">
                            <ArrowBarToLeft />
                        </span>
                    </span>
                </Button>
            </span>
            <style>{`
                .hk-wrapper[data-layout-style="default"] .brand-icon-only {
                    display: none !important;
                }
                .hk-wrapper[data-layout-style="collapsed"][data-hover="active"] .hk-menu:hover .brand-icon-only {
                    display: none !important;
                }
                .hk-wrapper .menu-header > span .navbar-brand .brand-img.logo-light,
                .hk-wrapper .menu-header > span .navbar-brand .brand-img.logo-dark {
                    margin-left: 0 !important;
                }
            `}</style>
        </div>
    )
}


export default SidebarHeader
