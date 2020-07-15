class App {

  constructor() {
    this.init()
  }

  init() {
    this._initScene()
    this._initTube()
    this._initPlanes()
    this._bindEvent()
    this._initVars()
    this._render()
  }

  _bindEvent() {
    window.addEventListener('resize', this._onResize.bind(this))
    document.addEventListener('wheel', e => {
      this.speed += e.deltaY * 0.002
    })
  }

  _onResize() {
    this.ww = window.innerWidth
    this.wh = window.innerHeight
    this.renderer.setSize(this.ww, this.wh)
    this.camera.aspect = this.ww / this.wh
    this.camera.updateProjectionMatrix()
  }

  _initTube() {
    function CustomSinCurve(scale) {
      THREE.Curve.call( this )
      this.scale = ( scale === undefined ) ? 1 : scale
    }
    CustomSinCurve.prototype = Object.create(THREE.Curve.prototype)
    CustomSinCurve.prototype.constructor = CustomSinCurve
    CustomSinCurve.prototype.getPoint = function (t) {
      const tx = Math.cos(2 * Math.PI * t)
      const ty = Math.sin(2 * Math.PI * t)
      const tz = 0.1 * Math.sin(8 * Math.PI * t)

      // t = t * 4 * Math.PI
      // const a = this.radius / 2
      // const tx = a * (1 + Math.cos(t))
      // const ty = a * Math.sin(t)
      // const tz = 2 * a * Math.sin(t / 2)
      
      return new THREE.Vector3(tx, ty, tz).multiplyScalar(this.scale)
    }
    const path = new CustomSinCurve(40)
    this.tubeGeometry = new THREE.TubeGeometry(path, 200, 1, 8, false)
    const material = new THREE.MeshBasicMaterial({ 
      side: THREE.DoubleSide,
      map: new THREE.TextureLoader().load('img/map.png')
    })
    material.map.wrapS = THREE.RepeatWrapping;
    material.map.wrapT= THREE.RepeatWrapping;
    material.map.repeat.set(10, 1)
    const mesh = new THREE.Mesh(this.tubeGeometry, material)
    this.scene.add(mesh)
  }

  _initScene() {
    this.ww = window.innerWidth
    this.wh = window.innerHeight
    this.camera = new THREE.PerspectiveCamera(45, this.ww/this.wh, 0.1, 1000)
    this.scene = new THREE.Scene()
    this.renderer = new THREE.WebGLRenderer({
      antialias: true
    })
    this.renderer.setSize(this.ww, this.wh)
    document.body.appendChild(this.renderer.domElement)

    this.camera.position.z = 150
  }

  _initPlanes() {
    this.planes = []
    const tex1 = new THREE.TextureLoader().load('img/t1.png')
    const tex2 = new THREE.TextureLoader().load('img/t2.png')
    const geo = new THREE.PlaneBufferGeometry(0.5, 0.5)
    const mat1 = new THREE.MeshBasicMaterial({
      transparent: true,
      map: tex1
    })
    const mat2 = new THREE.MeshBasicMaterial({
      transparent: true,
      map: tex2
    })
    geo.center()
    const mesh = new THREE.Mesh(geo, mat1)
    for(let i = 0; i < 20; i++) {
      const plane = mesh.clone()
      if(i % 2 == 0) {
        plane.material = mat1
      } else {
        plane.material = mat2
      }
      plane.position.copy(this.tubeGeometry.parameters.path.getPointAt(i * 0.04))
      this.planes.push(plane)
      this.scene.add(plane)
    }
    
   
  }
  

  _initVars() {
    //this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)
    this.binormal = new THREE.Vector3()
    this.normal = new THREE.Vector3()
    this.time = 0    
    this.position = 0
    this.speed = 0
  }

  _render() {
    //this.time = this.position * 100
    this.time += 10
    let looptime = 20 * 1000
    let t = ( this.time % looptime ) / looptime
    let pos = this.tubeGeometry.parameters.path.getPointAt(t)

    let segments = this.tubeGeometry.tangents.length
    let pickt = t * segments
    let pick = Math.floor(pickt)
    let pickNext = (pick + 1) % segments
    let offset = 0
    
    this.binormal.subVectors(this.tubeGeometry.binormals[pickNext], this.tubeGeometry.binormals[pick])
    this.binormal.multiplyScalar(pickt - pick).add(this.tubeGeometry.binormals[pick])
    let dir = this.tubeGeometry.parameters.path.getTangentAt(t)
   
    this.normal.copy(this.binormal).cross(dir)
    pos.add(this.normal.clone().multiplyScalar(offset))
    this.camera.position.copy(pos)
    let lookAt = this.tubeGeometry.parameters.path.getPointAt((t+1/this.tubeGeometry.parameters.path.getLength())%1) 
    this.camera.matrix.lookAt(this.camera.position, lookAt, this.normal)
    this.camera.rotation.setFromRotationMatrix(this.camera.matrix, this.camera.rotation.order)

    this.position += this.speed
    this.position = this.position < 0 ? 0 : this.position
    this.speed *= 0.9

    this.planes.forEach(plane => {
      plane.quaternion.copy(this.camera.quaternion)
    })


    this.renderer.render(this.scene, this.camera)
    requestAnimationFrame(this._render.bind(this))
  }

}

const app = new App()