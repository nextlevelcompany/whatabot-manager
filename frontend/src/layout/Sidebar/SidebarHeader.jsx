import React, { useState, useEffect } from 'react';
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

const getApiBase = () => {
    if (typeof window !== 'undefined') {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
        return `${protocol}//${hostname}:8081`;
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8081';
};

const SidebarHeader = () => {
    const { states, dispatch } = useGlobalStateContext();
    const { theme } = useTheme();
    const [logoUrl, setLogoUrl] = useState(null);
    const [faviconUrl, setFaviconUrl] = useState(null);
    const [logoHeight, setLogoHeight] = useState(48);
    const [faviconHeight, setFaviconHeight] = useState(32);

    useEffect(() => {
        const fetchLogo = async () => {
            try {
                const API_BASE = getApiBase();
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE}/api/settings`, {
                    headers: {
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data['empresa.logo']) {
                        setLogoUrl(`${API_BASE}${data['empresa.logo']}`);
                    } else {
                        setLogoUrl(null);
                    }
                    if (data['empresa.favicon']) {
                        setFaviconUrl(`${API_BASE}${data['empresa.favicon']}`);
                    } else {
                        setFaviconUrl(null);
                    }
                    if (data['empresa.logo.height']) {
                        setLogoHeight(parseInt(data['empresa.logo.height']));
                    } else {
                        setLogoHeight(48);
                    }
                    if (data['empresa.favicon.height']) {
                        setFaviconHeight(parseInt(data['empresa.favicon.height']));
                    } else {
                        setFaviconHeight(32);
                    }
                }
            } catch (e) {
                console.warn("No se pudo cargar el logo/favicon en SidebarHeader (servidor reiniciándose o fuera de línea):", e.message || e);
            }
        };
        fetchLogo();

        if (typeof window !== 'undefined') {
            window.addEventListener('logo-updated', fetchLogo);
            return () => {
                window.removeEventListener('logo-updated', fetchLogo);
            };
        }
    }, []);

    const toggleSidebar = () => {
        dispatch({ type: 'sidebar_toggle' });
    }

    return (
        <div className="menu-header">
            <span>
                <Link className="navbar-brand" href="/">
                    {/* Icono pequeño para estado colapsado */}
                    {faviconUrl ? (
                        <img className="brand-img img-fluid brand-icon-only" src={faviconUrl} alt="brand" style={{ height: `${faviconHeight}px`, width: 'auto', objectFit: 'contain' }} />
                    ) : logoUrl ? (
                        <img className="brand-img img-fluid brand-icon-only" src={logoUrl} alt="brand" style={{ height: `${faviconHeight}px`, width: 'auto', objectFit: 'contain' }} />
                    ) : (
                        <Image className="brand-img img-fluid brand-icon-only" src={logo} alt="brand" style={{ height: `${faviconHeight}px`, width: 'auto', objectFit: 'contain' }} />
                    )}

                    {/* Logo completo para estado expandido */}
                    {logoUrl ? (
                        theme === "light" ? (
                            <img className="brand-img img-fluid logo-light" src={logoUrl} alt="brand" style={{ height: `${logoHeight}px`, width: 'auto', objectFit: 'contain' }} />
                        ) : (
                            <img className="brand-img img-fluid logo-dark" src={logoUrl} alt="brand" style={{ height: `${logoHeight}px`, width: 'auto', objectFit: 'contain' }} />
                        )
                    ) : (
                        theme === "light" ? (
                            <Image className="brand-img img-fluid logo-light" src={jampackImg} alt="brand" style={{ height: '80px', width: 'auto', objectFit: 'contain' }} />
                        ) : (
                            <Image className="brand-img img-fluid logo-dark" src={jampackImgDark} alt="brand" style={{ height: '80px', width: 'auto', objectFit: 'contain' }} />
                        )
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
