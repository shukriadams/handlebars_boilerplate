let chokidar = require('chokidar'),
    fs = require('fs-extra'),
    fileconcat = require('fileconcat'),
    path = require('path'),
    sass = require('node-sass'),
    process = require('process'),
    cwd = process.cwd(),
    runner = require('node-sass-runner'),
    sassGlob = './sass/**/*.scss',
    _triggerFile = null

module.exports = {

    async watch(){

        // wipe and set up required paths
        fs.removeSync(path.join(cwd, '.tmp'))
        fs.ensureDirSync(path.join(cwd, '.tmp'))

        // start watching sass files
        const watcher = chokidar.watch([sassGlob], {
            persistent: true,
            usePolling: true,
            ignoreInitial: true
        })

        watcher
            .on('add', async file => {
                await this.handleSassEvent(file)
            })
            .on('change', async file =>{
                await this.handleSassEvent(file)
            })
            .on('unlink', async file =>{
                const outfile = this.mapSassToCss(file)
                await fs.remove(outfile)
                await this.concatenate()
            })

        await this.renderAll()
    },

    async renderAll(){
        await runner({
            scssPath : sassGlob,
            cssOutFolder : path.join(cwd, '.tmp')
        })
        
        await this.concatenate()
    },


    async concatFiles(infiles, outFile){
        return new Promise((resolve, reject)=>{
            try {
                fileconcat(infiles, outFile).then(() => {
                    resolve()
                }) 
            } catch(ex){
                reject(ex)
            }
        })
    },


    /** 
     * Converts a Sass file map to its destination compiled css path in ./tmp folder
     */
    mapSassToCss(file){
        return path.join(
            cwd,
            '.tmp',
            path.dirname(file),
            path.basename(file).substr(0, path.basename(file).length - 5) + '.css') // remove .scss extension
    },

    async concatenate(){
        await fs.ensureDir(path.join(cwd, 'web/css'))
        await this.concatFiles([path.join(cwd, '.tmp/**/*.css')], path.join(cwd, 'web/css/style.css'))
    },

    /** 
     * Called by SassWatcher when a sass file is added or changed. Compiles the sass that triggered
     * event, then concats all css files in ./tmp and places it in Express public folder. To improve
     * performance, if multiple Sass files trigger simultaneously concating is done only after the last
     * Sass file is compiled.
     */
    async handleSassEvent(file){
        _triggerFile = file
        console.log('sass', file)
        await this.compileSassFile(file)
        
        if (_triggerFile === file){
            await this.concatenate()
            console.log(`concatenated css after last change to ${file}`)
        }
    },

    /** 
     * Compiles a Sass file to Css. CSS is written to ./tmp/css folder.
     */
    async compileSassFile(file){
        return new Promise((resolve, reject)=>{

            try {
                sass.render({
                    file: file,
                    sourceComments: true
                }, (err, result)=>{
                    if (err){
                        console.log(err)
                        return resolve(err)
                    }

                    const outfile = this.mapSassToCss(file)
                    fs.ensureDirSync(path.dirname(outfile))
                    fs.writeFileSync(outfile, result.css)
                    console.log(`compiled ${outfile}`)
                    resolve()
            
                })
            }catch(ex){
                reject(ex)
            }
        })
    }

}