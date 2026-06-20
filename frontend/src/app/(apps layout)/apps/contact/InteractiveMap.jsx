'use client';
import { useEffect, useRef } from 'react';

const InteractiveMap = ({ lat, lng, onChange }) => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const onChangeRef = useRef(onChange);

    // Keep onChange ref updated to avoid recreating listeners
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    // 1. Initialize map only once
    useEffect(() => {
        let isMounted = true;
        let mapInstance = null;

        const initLeaflet = () => {
            if (!window.L) return;
            if (!mapContainerRef.current) return;
            if (mapRef.current) return; // Already initialized

            const startLat = lat || -12.046374;
            const startLng = lng || -77.042793;

            // Create new map
            mapInstance = window.L.map(mapContainerRef.current).setView([startLat, startLng], 15);
            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(mapInstance);

            const markerInstance = window.L.marker([startLat, startLng], { draggable: true }).addTo(mapInstance);
            
            // Marker dragging listener
            markerInstance.on('dragend', () => {
                const pos = markerInstance.getLatLng();
                if (onChangeRef.current) {
                    onChangeRef.current(pos.lat, pos.lng);
                }
            });

            // Map click listener
            mapInstance.on('click', (e) => {
                markerInstance.setLatLng(e.latlng);
                if (onChangeRef.current) {
                    onChangeRef.current(e.latlng.lat, e.latlng.lng);
                }
            });

            mapRef.current = mapInstance;
            markerRef.current = markerInstance;

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
                markerRef.current = null;
            }
        };
    }, []); // Empty dependencies: only run once on mount!

    // 2. Synchronize props (lat, lng) with map and marker
    useEffect(() => {
        if (!mapRef.current || !markerRef.current) return;
        
        const targetLat = lat || -12.046374;
        const targetLng = lng || -77.042793;

        const currentMarkerLatLng = markerRef.current.getLatLng();
        
        // Only update if difference is significant to avoid infinite jitter
        const diffLat = Math.abs(currentMarkerLatLng.lat - targetLat);
        const diffLng = Math.abs(currentMarkerLatLng.lng - targetLng);

        if (diffLat > 0.00001 || diffLng > 0.00001) {
            markerRef.current.setLatLng([targetLat, targetLng]);
            mapRef.current.setView([targetLat, targetLng]);
        }
    }, [lat, lng]);

    return (
        <div 
            ref={mapContainerRef} 
            className="border rounded overflow-hidden" 
            style={{ width: '100%', height: '100%', minHeight: '100%', zIndex: 1 }} 
        />
    );
};

export default InteractiveMap;
