const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());

// Simular el endpoint de ArcGIS para que Experience Builder lo reconozca
app.get('/nominatim/rest/services/GeocodeServer', (req, res) => {
    res.json({
        currentVersion: 10.81,
        serviceDescription: "Proxy Nominatim",
        addressTypes: ["StreetAddress"],
        capabilities: "Geocode",
        spatialReference: { wkid: 4326, latestWkid: 4326 },
        locatorProperties: { MaxBatchSize: 10 }
    });
});

// Realizar la búsqueda real en OSM
app.get('/nominatim/rest/services/GeocodeServer/findAddressCandidates', async (req, res) => {
    const query = req.query.SingleLine || req.query.address || "";
    if (!query) return res.json({ candidates: [] });

    try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`, {
            headers: { 'User-Agent': 'ArcGIS-OSM-Proxy-Personal' }
        });
        
        const candidates = response.data.map(item => ({
            address: item.display_name,
            location: { x: parseFloat(item.lon), y: parseFloat(item.lat) },
            score: 100,
            attributes: { }
        }));
        
        res.json({ spatialReference: { wkid: 4326 }, candidates });
    } catch (error) {
        res.status(500).json({ error: "Error de conexión con OSM" });
    }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Servidor corriendo en puerto ${port}`));
