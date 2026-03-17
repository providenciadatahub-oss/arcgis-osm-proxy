const Koop = require('koop')
const nominatim = require('koop-provider-nominatim')
const express = require('express')

const koop = new Koop()
koop.register(nominatim)

const app = express()
// Importante: Esto permite que ArcGIS se conecte sin bloqueos
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(koop.server)

const port = process.env.PORT || 8080
app.listen(port, () => console.log(`Proxy GIS activo en puerto ${port}`))
