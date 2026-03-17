const Koop = require('@koopjs/koop')
const nominatim = require('koop-provider-nominatim')
const express = require('express')

const koop = new Koop()
// Registra el proveedor de Nominatim
koop.register(nominatim)

const app = express()
// Esto es vital para que ArcGIS Online no bloquee la petición
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(koop.server)

const port = process.env.PORT || 8080
app.listen(port, () => console.log(`Proxy GIS corriendo en puerto ${port}`))
