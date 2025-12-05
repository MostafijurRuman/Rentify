import app from "./app"
import config from "./config/config"
const port = config.port;


app.listen(port,()=>{
    console.log(`Rentify is running on port: ${port}`)
})