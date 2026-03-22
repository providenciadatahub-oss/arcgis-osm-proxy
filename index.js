const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());

// --- SECCIÓN 1: NOMINATIM (BUSCADOR DE DIRECCIONES) ---

app.get('/arcgis/rest/services/Nominatim/GeocodeServer', (req, res) => {
    res.json({
        currentVersion: 10.81,
        serviceDescription: "Nominatim Proxy para ArcGIS Online",
        addressTypes: ["StreetAddress"],
        capabilities: "Geocode",
        spatialReference: { wkid: 4326, latestWkid: 4326 },
        locatorProperties: { MaxBatchSize: 100, MaxResultSize: 100 },
        locators: [],
        singleLineAddressField: { 
            name: "SingleLine", 
            type: "esriFieldTypeString", 
            alias: "Single Line Input", 
            required: false, 
            length: 200 
        },
        candidateFields: [
            { name: "Shape", type: "esriFieldTypeGeometry", alias: "Shape" },
            { name: "Score", type: "esriFieldTypeDouble", alias: "Score" },
            { name: "Match_addr", type: "esriFieldTypeString", alias: "Match_addr" }
        ]
    });
});

app.get('/arcgis/rest/services/Nominatim/GeocodeServer/findAddressCandidates', async (req, res) => {
    const query = req.query.SingleLine || req.query.address || "";
    if (!query) return res.json({ spatialReference: { wkid: 4326 }, candidates: [] });

    try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=10`, {
            headers: { 'User-Agent': 'ArcGIS-OSM-Proxy-Integration' }
        });
        
        const candidates = response.data.map(item => ({
            address: item.display_name,
            location: { x: parseFloat(item.lon), y: parseFloat(item.lat) },
            score: 100,
            attributes: { 
                Match_addr: item.display_name,
                Addr_type: "StreetAddress" 
            }
        }));
        
        res.json({ spatialReference: { wkid: 4326, latestWkid: 4326 }, candidates });
    } catch (error) {
        res.status(500).json({ error: "Error de red en Geocode" });
    }
});

// --- SECCIÓN 2: OSRM (GENERADOR DE RUTAS GRATIS) ---

// Endpoint de información del servicio de rutas (Handshake)
app.get('/arcgis/rest/services/OSRM/NAServer/Route', (req, res) => {
    res.json({
        currentVersion: 10.81,
        serviceName: "OSRM Route Proxy",
        capabilities: "Route",
        networkDatasetName: "OpenStreetMap Network",
        supportedTravelModes: [{ name: "Driving", id: "1" }]
    });
});

// Endpoint para calcular la ruta entre dos puntos
app.get('/arcgis/rest/services/OSRM/NAServer/Route/solve', async (req, res) => {
    const stops = req.query.stops; // ArcGIS envía stops como "lon,lat;lon,lat"
    if (!stops) return res.status(400).json({ error: "Se requieren paradas (stops)" });

    try {
        // Consultamos a OSRM (Gratis)
        const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${stops}?overview=full&geometries=geojson`;
        const response = await axios.get(osrmUrl);

        if (!response.data.routes || response.data.routes.length === 0) {
            return res.json({ messages: ["No se encontró ruta"] });
        }

        const route = response.data.routes[0];

        // Traducimos el GeoJSON de OSRM al formato de ArcGIS
        const arcgisResponse = {
            routes: {
                features: [{
                    geometry: {
                        paths: [route.geometry.coordinates], // OSRM da [ [lon, lat], ... ]
                        spatialReference: { wkid: 4326 }
                    },
                    attributes: {
                        Total_Minutes: route.duration / 60,
                        Total_Kilometers: route.distance / 1000
                    }
                }]
            }
        };

        res.json(arcgisResponse);
    } catch (error) {
        res.status(500).json({ error: "Error de red en Routing" });
    }
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`Proxy ArcGIS (Geocodificación + Rutas) activo en puerto ${port}`));
