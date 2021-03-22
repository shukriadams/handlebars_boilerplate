const handlebarsLoader = require('madscience-handlebarsloader'),
    chokidar = require('chokidar'),
    process = require('process'),
    cwd = process.cwd(),    
    fs = require('fs-extra'),
    hbsGlob  = './handlebars/**/*.hbs',
    path = require('path')

module.exports = {
    async watch(){

        const workPath = path.join(cwd, 'web')
        fs.ensureDirSync(workPath)

        const watcher = chokidar.watch([hbsGlob], {
            persistent: true,
            usePolling: true, 
            ignoreInitial: true
        })

        watcher
            .on('add', async file => {
                await this.renderAll()
            })
            .on('change', async file =>{
                await this.renderAll()
            })
            .on('unlink', async file =>{
                await this.renderAll()
            })

        await this.renderAll()
    },

    async renderSingle(templateName){
        const page = await handlebarsLoader.getPage(templateName)
        await fs.outputFile(path.join('./web', `${templateName}.html`), page(handlebarsLoader.model))

    },

    async renderAll(){
        handlebarsLoader.initialize({ 
            pages : './handlebars/pages',
            partials : './handlebars/partials',
            data : './handlebars/data',
            helpers : './handlebars/helpers',
            forceInitialize : true
        })

        await this.renderSingle('index')
        await this.renderSingle('games')
        await this.renderSingle('kitchensink')
        console.log('Rendered all pages.')
    }
}