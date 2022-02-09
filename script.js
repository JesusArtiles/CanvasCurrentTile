        var c = document.getElementById("myCanvas");
        var ctx = c.getContext("2d");

        var lon0 = -15.4203
        var lon1 = -14.8937
        var lat0 = 27.8505
        var lat1 = 28.3446

        var latSize = 70
        var lonSize = 74

        var width = c.width
        var height = c.height

        var stepY = height/latSize
        var stepX = width/lonSize

        var lonLine = Math.abs(lon0) - Math.abs(lon1)
        var latLine = lat1 - lat0

        var trail = 50
        var maxParticles = 5000
        var allParticles = 0

        class Sector{
            constructor(u, v, mag, lon, lat){
                this.u = u
                this.v = v
                this.mag = mag
                this.lon = lon
                this.lat = lat 
                this.x = (width * Math.abs(lon0 + (-1*lon)))/lonLine
                this.y = (height * Math.abs(lat1 - (lat)))/latLine
                if(mag != 0){
                    this.particles = []
                    this.addParticle()
                }else{
                    this.particles = []
                }
                this.counter = 0
            }

            addParticle() {
                if(allParticles >= maxParticles)return
                this.particles.push(new Particle((Math.random() * ((this.x+stepX) - this.x) + this.x), (Math.random() * ((this.y+stepY) - this.y)+ this.y) , this.u, this.v, this))
                allParticles++
            }

            removeParticle(p) {
                this.particles = this.particles.filter(particle => particle != p)
                allParticles--
            }

            update() {
                if(this.particles.length == 0){
                    this.addParticle()
                }
            }

            //Not neccesarry in final version, just for testing
            draw() {
                if(this.mag != 0){
                    ctx.beginPath();
                    //x, y, w, h
                    ctx.rect(this.x, this.y, stepX, stepY);
                    ctx.strokeStyle = "rgba(255,255,255,0.1)";
                    ctx.closePath
                    ctx.stroke();
                }else{
                    ctx.beginPath();
                    //x, y, w, h
                    ctx.rect(this.x, this.y, stepX, stepY);
                    ctx.strokeStyle = "rgba(235, 64, 52, 0.1)";
                    ctx.closePath
                    ctx.stroke();
                }
            }
        }

        var color_scale = chroma.scale(
        ["rgb(36,104, 180)",
        "rgb(60,157, 194)",
        "rgb(128,205,193)",
        "rgb(151,218,168)",
        "rgb(198,231,181)",
        "rgb(238,247,217)",
        "rgb(255,238,159)",
        "rgb(252,217,125)",
        "rgb(255,182,100)",
        "rgb(252,150,75)",
        "rgb(250,112,52)",
        "rgb(245,64,32)",
        "rgb(237,45,28)",
        "rgb(220,24,32)",
        "rgb(180,0,35)"]).domain([0,100]);      

        class Particle{
            constructor(lon, lat, dirX, dirY, sector) {
              this.x = lon
              this.y = lat
              this.dirX = dirX
              this.dirY = dirY
              this.size = 2
              this.instances = []
              this.sector = sector
              this.color = color_scale(sector.mag)
              this.deathCounter =  Math.floor((Math.random() * (1500 - 500) + 500))
              this.dead = false
              this.colorCounter = 1
              this.mother = true
              this.alpha = 1
            }

            addInstance(p) {
                if (this.instances.length > trail) this.instances.shift();
                this.instances.push(p);
            }

            startDeath() {
                this.dirX = this.dirX/10
                this.dirY = this.dirY/10
                this.dead = true
            }

            update() {
                if(this.dead) {
                    if(this.colorCounter <= 0){
                        this.sector.removeParticle(this)
                        return
                    } 
                    if(this.colorCounter < 0.6)this.color = color_scale(0)
                    this.alpha = this.colorCounter
                    this.colorCounter = ((this.colorCounter*20)-(0.1*10))/20
                }else{
                    if(this.deathCounter < 0){
                        this.startDeath()
                        this.sector.addParticle()                    
                        return
                    }
                    this.deathCounter--
                    if(!this.dead){
                        var sector = getActualSector(this)
                        if(sector != null){
                            if(sector.mag != 0){
                                this.dirX = sector.u
                                this.dirY = sector.v
                                this.color = color_scale(sector.mag)
                                if(this.colorCounter < 1){
                                    this.alpha = this.colorCounter
                                    this.colorCounter = ((this.colorCounter*10)+(0.1*10))/10
                                }
                            }else{
                                this.startDeath()
                            }
                        }
                    }
                }   
                this.addInstance([this.x, this.y, this.color])
                this.x += this.dirX/100
                this.y += this.dirY/100
            }

            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.fillRect(this.x, this.y, this.size, this.size);
                ctx.fill()

                if(this.instances.length != 0 && !this.dead){
                    var x1 = this.instances[0][0]
                    var y1 = this.instances[0][1]
                    var x0 = this.x+(this.size/2)
                    var y0 = this.y+(this.size/2)
                    // Create gradient
                    var grd = ctx.createLinearGradient(x0, y0, x1, y1);
                    ctx.globalAlpha = this.alpha;
                    grd.addColorStop(0, this.color);
                    grd.addColorStop(1, "transparent");
                    ctx.beginPath();
                    ctx.moveTo(x0, y0);
                    ctx.lineTo(x1, y1)
                    ctx.lineWidth = this.size;
                    ctx.strokeStyle = grd
                    ctx.stroke()
                }
            }
        }

        function getActualSector(particle) {
            for(var sector of sectors){
                if((particle.x >= sector.x && particle.x <= (sector.x + stepX)) && 
                    particle.y >= sector.y && particle.y <= (sector.y + stepY)){
                        return sector
                }
            }
            return null
        }

        var sectors = []

        async function getSectors(){
            await fetch("data.json")
            .then(response => response.json())
            .then((json) => {
                for(var sector of json){
                    sectors.push(new Sector((sector.u != 0)?sector.u:0, (sector.v != 0)?sector.v:0, sector.mag, sector.lon, sector.lat))
                }
            })
        }

        function animate() {        
            ctx.clearRect(0, 0, width, height);
            var infoSectors = sectors.filter(el => el.mag != 0)
            for(var sector of infoSectors){
                //sector.draw()
                sector.update()
                for(var particle of sector.particles){
                    particle.update()
                    particle.draw()
                }
            }
            requestAnimationFrame(animate)
        }

        getSectors().then(()=>{
            animate()
        })

        


            