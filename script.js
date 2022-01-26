        var c = document.getElementById("myCanvas");
        var ctx = c.getContext("2d");

        var startX = 0
        var endX = 1000
        var startY = 0
        var endY = 1000

        var stepY = endY/70
        var stepX = endX/74

        var lon0 = -15.4203
        var lon1 = -14.8937
        var lat0 = 27.8505
        var lat1 = 28.3446

        var lonLine = Math.abs(lon0) - Math.abs(lon1)
        var latLine = lat1 - lat0

        var trail = 25
        var maxParticles = 5000
        var allParticles = 0

        class Sector{
            constructor(u, v, mag, lon, lat){
                this.u = u
                this.v = v
                this.mag = mag
                this.lon = lon
                this.lat = lat 
                this.x = (1000 * Math.abs(lon0 + (-1*lon)))/lonLine
                this.y = (1000 * Math.abs(lat1 - (lat)))/latLine
                this.birthCounter = (Math.random() * (200 - 50) + 50)
                if(mag != 0){
                    this.particles = []
                    this.addParticle()
                    //this.addParticle()
                    //this.addParticle()
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
                if(this.mag == 0) return 
                // if(this.birthCounter < 0){
                //     this.addParticle()
                //     this.birthCounter = (Math.random() * (1500 - 100) + 100)
                // }
                // this.birthCounter--
                if(this.particles.length == 0){
                    this.addParticle()
                }
                for(var particle of this.particles){
                    if(particle.mother && (((this.x > particle.x)||((this.x+stepX) < particle.x)) && ((this.y > particle.y)||((this.y+stepY)<particle.y)))){
                        particle.mother = false
                        this.addParticle()
                    }
                   
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
        
        const defaulColorScale = [
            "rgba(36,104, 180)",
            "rgba(60,157, 194)",
            "rgba(128,205,193)",
            "rgba(151,218,168)",
            "rgba(198,231,181)",
            "rgba(238,247,217)",
            "rgba(255,238,159)",
            "rgba(252,217,125)",
            "rgba(255,182,100)",
            "rgba(252,150,75)",
            "rgba(250,112,52)",
            "rgba(245,64,32)",
            "rgba(237,45,28)",
            "rgba(220,24,32)",
            "rgba(180,0,35)"
        ];

        var colorMag = []
        counter = 0
        for(var color of defaulColorScale) {
            colorMag.push(counter)
            counter+=100/15
        }        

        class Particle{
            constructor(lon, lat, dirX, dirY, sector) {
              this.x = lon
              this.y = lat
              this.dirX = dirX
              this.dirY = dirY
              this.size = 1
              this.instances = []
              this.sector = sector
              this.color = getActualColor(sector.mag)
              this.deathCounter = (Math.random() * (2000 - 100) + 100)
              this.dead = false
              this.colorCounter = 1
              this.mother = true
            }

            addInstance(p) {
                if (this.instances.length > trail) this.instances.shift();
                this.instances.push(p);
            }

            startDeath() {
                //this.color = defaulColorScale[0]
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
                    var split = this.color.split(',')
                    if(split.length > 3){
                        this.color = split[0]+','+split[1]+','+split[2]+','+this.colorCounter+')'
                    }else{
                        this.color = this.color.split(')')[0] + ','+this.colorCounter+')'
                    }
                    this.colorCounter = ((this.colorCounter*10)-(0.1*10))/10
                }
                if(this.deathCounter < 0 && !this.dead){
                    this.startDeath()
                    return
                }
                this.deathCounter--
                if(!this.dead){
                    var sector = getActualSector(this)
                    if(sector != null){
                        if(sector.mag != 0){
                            this.dirX = sector.u
                            this.dirY = sector.v
                            this.color = getActualColor(sector.mag)
                        }else{
                            this.startDeath()
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
                //ctx.fillRect(this.x, this.y, 2, 2);
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2) //use rect instead of arc
                ctx.fill()

                if(this.instances.length != 0 && !this.dead){
                    var toX = this.instances[0][0]
                    var toY = this.instances[0][1]
                    ctx.beginPath();
                    ctx.moveTo(this.x+(this.size/2), this.y+(this.size/2));
                    ctx.lineTo(toX, toY)
                    ctx.lineWidth = 0.5;
                    ctx.strokeStyle = this.color
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

        function getActualColor(mag) {
            return defaulColorScale[colorMag.indexOf(closest(mag, colorMag))]
        }

        function closest(needle, haystack) {
            return haystack.reduce((a, b) => {
                let aDiff = Math.abs(a - needle);
                let bDiff = Math.abs(b - needle);
        
                if (aDiff == bDiff) {
                    return a > b ? a : b;
                } else {
                    return bDiff < aDiff ? b : a;
                }
            });
        }

        var sectors = []
        var minX = 0
        var maxX = 0
        var minY = 0
        var maxY = 0

        async function getSectors(){
            await fetch("data.json")
            .then(response => response.json())
            .then((json) => {
                for(var sector of json){
                    sectors.push(new Sector((sector.u != 0)?sector.u:0, (sector.v != 0)?sector.v:0, sector.mag, sector.lon, sector.lat))
                }
                var sectorX = []
                var sectorY = []
                for(var sector of sectors){
                    sectorX.push(sector.x)
                    sectorY.push(sector.y)
                }   
                minX = Math.min.apply(null,sectorX)
                maxX = Math.max.apply(null,sectorX)
                minY = Math.min.apply(null,sectorY)
                maxY = Math.max.apply(null,sectorY)
            })
        }

        function animate() {        
            ctx.clearRect(0, 0, 1000, 1000);
            for(var sector of sectors){
                sector.draw()
                sector.update()
                for(var particle of sector.particles){
                    particle.draw()
                    particle.update()
                }
            }
            console.log(allParticles);
            requestAnimationFrame(animate)
        }

        getSectors().then(()=>{
            animate()
        })

        


            