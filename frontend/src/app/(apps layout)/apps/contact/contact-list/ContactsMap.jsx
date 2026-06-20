'use client';
import { useEffect, useRef } from 'react';

const ContactsMap = ({ contacts }) => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);

    useEffect(() => {
        let isMounted = true;
        let mapInstance = null;

        const initLeaflet = () => {
            if (!window.L) return;
            if (!mapContainerRef.current) return;
            if (mapRef.current) return; // Already initialized

            // 1. Collect all addresses with valid coordinates
            const markersData = [];
            contacts.forEach(c => {
                const displayName = c.tipoPersona === 'NATURAL'
                    ? `${c.nombres || ''} ${c.apellidos || ''}`.trim()
                    : (c.razonSocial || '');
                const displayType = c.tipoPersona === 'NATURAL' ? '👤 Persona Natural' : '🏢 Empresa';
                const documentStr = `${c.tipoDocumento || 'DNI'} ${c.numeroDocumento || ''}`;
                
                if (Array.isArray(c.direcciones)) {
                    c.direcciones.forEach(dir => {
                        if (dir.latitud && dir.longitud) {
                            markersData.push({
                                lat: dir.latitud,
                                lng: dir.longitud,
                                contactId: c.id,
                                displayName,
                                displayType,
                                documentStr,
                                phone: c.telefonoPrincipal,
                                email: c.email,
                                nombreUbicacion: dir.nombreUbicacion || 'Ubicación',
                                direccionCompleta: dir.direccionCompleta,
                                referencia: dir.referencia
                            });
                        }
                    });
                }
            });

            // 2. Set default view (Lima, Peru center or average of coordinates)
            let centerLat = -12.046374;
            let centerLng = -77.042793;
            let zoom = 12;

            if (markersData.length > 0) {
                const sumLat = markersData.reduce((sum, m) => sum + m.lat, 0);
                const sumLng = markersData.reduce((sum, m) => sum + m.lng, 0);
                centerLat = sumLat / markersData.length;
                centerLng = sumLng / markersData.length;
                zoom = markersData.length === 1 ? 15 : 12;
            }

            // Create new map
            mapInstance = window.L.map(mapContainerRef.current).setView([centerLat, centerLng], zoom);
            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(mapInstance);

            // 3. Add markers
            const leafletMarkers = [];
            markersData.forEach(m => {
                const popupContent = `
                    <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 220px; padding: 4px;">
                        <h6 style="margin: 0 0 4px 0; font-weight: 700; color: #4f46e5; font-size: 14px;">${m.displayName}</h6>
                        <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
                            <span>${m.displayType}</span> • <span>${m.documentStr}</span>
                        </div>
                        <div style="font-size: 12px; margin-bottom: 4px; font-weight: 600;">
                            📍 ${m.nombreUbicacion}
                        </div>
                        <div style="font-size: 12px; margin-bottom: 4px; color: #334155; line-height: 1.4;">
                            ${m.direccionCompleta}
                        </div>
                        ${m.referencia ? `<div style="font-size: 11px; color: #64748b; font-style: italic; margin-bottom: 8px; background: #f1f5f9; padding: 4px 6px; border-radius: 4px;">Ref: ${m.referencia}</div>` : ''}
                        <div style="border-top: 1px solid #e2e8f0; padding-top: 6px; margin-top: 6px; font-size: 11px; color: #475569;">
                            ${m.phone ? `📱 +51 ${m.phone}<br/>` : ''}
                            ${m.email ? `✉️ ${m.email}<br/>` : ''}
                        </div>
                        <div style="margin-top: 10px; text-align: right;">
                            <a href="/apps/contact/view-contact?id=${m.contactId}" style="display: inline-block; font-size: 11px; color: #fff; background-color: #4f46e5; padding: 5px 10px; border-radius: 6px; text-decoration: none; font-weight: 600; transition: background-color 0.2s;">Ver Detalles</a>
                        </div>
                    </div>
                `;

                const marker = window.L.marker([m.lat, m.lng]).addTo(mapInstance);
                marker.bindPopup(popupContent);
                leafletMarkers.push(marker);
            });

            // Adjust map bounds if multiple markers
            if (leafletMarkers.length > 1) {
                const group = new window.L.featureGroup(leafletMarkers);
                mapInstance.fitBounds(group.getBounds().pad(0.1));
            }

            mapRef.current = mapInstance;

            // Re-render map tiles to fit dimensions
            setTimeout(() => {
                if (mapInstance) mapInstance.invalidateSize();
            }, 300);
        };

        // Load Leaflet CSS
        if (!document.getElementById('leaflet-css-interactive')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css-interactive';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }

        // Load Leaflet JS
        if (!window.L) {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => {
                if (isMounted) initLeaflet();
            };
            document.head.appendChild(script);
        } else {
            initLeaflet();
        }

        return () => {
            isMounted = false;
            if (mapInstance) {
                mapInstance.remove();
                mapRef.current = null;
            }
        };
    }, [contacts]);

    return (
        <div className="border rounded overflow-hidden shadow-sm" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
            <div 
                ref={mapContainerRef} 
                style={{ width: '100%', height: '580px', minHeight: '450px', zIndex: 1 }} 
            />
        </div>
    );
};

export default ContactsMap;
