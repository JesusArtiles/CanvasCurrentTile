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

        var trail = 50
        maxParticles = 2000

        class Sector{
            constructor(u, v, mag, lon, lat){
                this.u = u
                this.v = v
                this.mag = mag
                this.lon = lon
                this.lat = lat 
                this.x = (1000 * Math.abs(lon0 + (-1*lon)))/lonLine
                this.y = (1000 * Math.abs(lat1 - (lat)))/latLine
                if(mag != 0){
                    this.particles = [new Particle((Math.random() * ((this.x+stepX) - this.x) + this.x), (Math.random() * ((this.y+stepY) - this.y)+ this.y) , this.u, this.v, this)]
                }else{
                    this.particles = []
                }
                this.counter = 0
            }

            addParticle() {
                this.particles.push(new Particle((Math.random() * ((this.x+stepX) - this.x) + this.x), (Math.random() * ((this.y+stepY) - this.y)+ this.y) , this.u, this.v, this))
            }

            removeParticle(p) {
                this.particles = this.particles.filter(particle => particle != p)
            }

            update() {
                // this.counter+=1
                // if(this.mag != 0 && this.counter > 80){
                //     this.addParticle()
                //     this.counter = 0
                // }
            }

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
            }

            add(p) {
                if (this.instances.length > trail) this.instances.shift();
                this.instances.push(p);
            }

            update() {
                var sector = getActualSector(this)
                if(sector != null){
                    if(sector.mag != 0){
                        this.dirX = sector.u
                        this.dirY = sector.v
                        this.color = getActualColor(sector.mag)
                    }else{
                        this.sector.removeParticle(this)
                    }
                }
                this.add([this.x, this.y, this.color])
                this.x += this.dirX/200
                this.y += this.dirY/200
            }

            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                //ctx.fillRect(this.x, this.y, 2, 2);
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2) //use rect instead of arc
                ctx.fill()

                if(this.instances.length != 0){
                    var toX = this.instances[0][0]
                    var toY = this.instances[0][1]
                    ctx.beginPath();
                    ctx.moveTo(this.x+(this.size/2), this.y+(this.size/2));
                    ctx.lineTo(toX, toY)
                    ctx.lineWidth = 0.5;
                    ctx.strokeStyle = this.color
                    ctx.stroke()
                }
                
                    //Too laggy
                //var counterS = 0
                //var coutnerC = 0
                // for(var p of this.instances){
                //     console.log(p[2].split(')')[0]+', 0.5)');
                //     ctx.fillStyle = p[2].split(')')[0]+', 0.5)';
                //     ctx.beginPath();
                //     ctx.fillRect(p[0], p[1], 0.4, 0.4);
                //     //ctx.arc(p[0], p[1], counterS, 0, Math.PI * 2)
                //     //ctx.closePath
                //     //ctx.fill()
                //     //counterS += this.size/trail
                //     //coutnerC += 1/trail
                // }
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
                //sector.draw()
                for(var particle of sector.particles){
                    particle.draw()
                    particle.update()
                }
            }
            var sect = this.sectors.filter(s => s.mag != 0)
            sect[Math.trunc(Math.random() * ((sect.length-1) - 0) + 0)].addParticle()
            console.log(sect.length);
            requestAnimationFrame(animate)
        }

        getSectors().then(()=>{
            animate()
        })

        


            