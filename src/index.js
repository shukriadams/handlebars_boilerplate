const handlebarsUtility = require('./lib/handlebarsUtility'),
    sassUtility = require('./lib/sassUtility'),
    port = 8080;

(async function(){

    const http = require('http'),
        Express = require('express'),
        app = Express()

    app.use(Express.static('./web'))
    app.use(Express.static('./assets'))
    
    await sassUtility.watch()
    await handlebarsUtility.watch()

    const server = http.createServer(app)
    server.listen(port)
    console.log(`express listening on port ${port}`)

})()