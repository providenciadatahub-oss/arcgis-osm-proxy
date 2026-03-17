const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());

// Ruta Raíz del Servicio (Handshake)
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

// Ruta de búsqueda (Traductor de Nominatim)
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
        res.status(500).json({ error: "Error de red" });
    }
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`Proxy ArcGIS-Nominatim activo`));
