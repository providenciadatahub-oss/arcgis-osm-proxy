const Koop = require('koop')
const nominatim = require('koop-provider-nominatim')
const express = require('express')

const koop = new Koop()
koop.register(nominatim)

const app = express()

// Ruta de diagnóstico: si entras a la URL verás este mensaje
app.get('/', (req, res) => res.send('Proxy GIS Online ✅ Activo'))

app.use(koop.server)

const port = process.env.PORT || 8080
app.listen(port, () => console.log(`Servidor activo en puerto ${port}`))
