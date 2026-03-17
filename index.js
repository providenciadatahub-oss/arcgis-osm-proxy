const Koop = require('koop')
const nominatim = require('koop-provider-nominatim')
const express = require('express')

const koop = new Koop()
koop.register(nominatim)

const app = express()

// Ruta de prueba para saber que funciona
app.get('/', (req, res) => res.send('Proxy GIS Online ✅'))

app.use(koop.server)

const port = process.env.PORT || 8080
app.listen(port, () => console.log(`Servidor activo en puerto ${port}`))
