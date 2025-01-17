//Scene.js
import { vec3, mat4 } from 'gl-matrix';
import getOptionsURL from './misc/getOptionsURL';
import Enums from './misc/Enums';
import Utils from './misc/Utils';
import SculptManager from './editing/SculptManager';
import Subdivision from './editing/Subdivision';
// import Import from 'files/Import';
import Gui from './gui/Gui';
import Camera from './math3d/Camera';
import Picking from './math3d/Picking';
// import Background from 'drawables/Background';
import Mesh from './mesh/Mesh';
import Multimesh from './mesh/multiresolution/Multimesh';
import Primitives from './drawables/Primitives';
import StateManager from './states/StateManager';
import RenderData from './mesh/RenderData';
// import Rtt from 'drawables/Rtt';
import ShaderLib from './render/ShaderLib';
import MeshStatic from './mesh/meshStatic/MeshStatic';
import WebGLCaps from './render/WebGLCaps';

class Scene {

  constructor() {
    this._gl = null; // webgl context

    this._cameraSpeed = 0.25;

    // cache canvas stuffs
    this._pixelRatio = 1.0;
    this._viewport = document.getElementById('viewport');
    this._canvas = document.getElementById('canvas');
    this._canvasWidth = 0;
    this._canvasHeight = 0;
    this._canvasOffsetLeft = 0;
    this._canvasOffsetTop = 0;

    // core of the app
    this._stateManager = new StateManager(this); // for undo-redo
    this._sculptManager = null;
    this._camera = new Camera(this);
    this._picking = new Picking(this);       // the ray picking
    this._pickingSym = new Picking(this, true); // the symmetrical picking

    // TODO primitive builder
    this._meshPreview = null;
    this._torusLength = 0.5;
    this._torusWidth = 0.1;
    this._torusRadius = Math.PI * 2;
    this._torusRadial = 32;
    this._torusTubular = 128;

    // renderable stuffs
    const opts = getOptionsURL();
    this._showContour = opts.outline;
    this._showGrid = opts.grid;
    this._grid = null;
    // this._background = null;
    this._meshes = []; // the meshes
    this._selectMeshes = []; // multi selection
    this._mesh = null; // the selected mesh

    // this._rttContour = null;     // rtt for contour
    // this._rttMerge = null;       // rtt decode opaque + merge transparent
    // this._rttOpaque = null;      // rtt half float
    // this._rttTransparent = null; // rtt rgbm

    // ui stuffs
    this._focusGui = false; // if the gui is being focused
    this._gui = new Gui(this);

    this._preventRender = false; // prevent multiple render per frame
    this._drawFullScene = false; // render everything on the rtt
    this._autoMatrix = opts.scalecenter; // scale and center the imported meshes
    this._vertexSRGB = true; // srgb vs linear colorspace for vertex color
  }

  start() {
    this.initWebGL();
    if (!this._gl) return;

    this._sculptManager = new SculptManager(this);
    // this._background = new Background(this._gl, this);

    // this._rttContour = new Rtt(this._gl, Enums.Shader.CONTOUR, null);
    // this._rttMerge = new Rtt(this._gl, Enums.Shader.MERGE, null);
    // this._rttOpaque = new Rtt(this._gl, Enums.Shader.FXAA);
    // this._rttTransparent = new Rtt(this._gl, null, this._rttOpaque.getDepth(), true);

    this._grid = Primitives.createGrid(this._gl);
    this.initGrid();

    this.loadTextures();
    this._gui.initGui();
    this.onCanvasResize();

    const modelURL = getOptionsURL().modelurl;
    if (modelURL) this.addModelURL(modelURL);
    else this.addSphere();
  }

  addModelURL(url) {
    const fileType = this.getFileType(url);
    if (!fileType) return;

    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);

    xhr.responseType = fileType === 'obj' ? 'text' : 'arraybuffer';

    xhr.onload = function () {
      if (xhr.status === 200)
        this.loadScene(xhr.response, fileType);
    }.bind(this);

    xhr.send(null);
  }

  // getBackground() {
  //   return this._background;
  // }

  getViewport() {
    return this._viewport;
  }

  getCanvas() {
    return this._canvas;
  }

  getPixelRatio() {
    return this._pixelRatio;
  }

  getCanvasWidth() {
    return this._canvasWidth;
  }

  getCanvasHeight() {
    return this._canvasHeight;
  }

  getCamera() {
    return this._camera;
  }

  getGui() {
    return this._gui;
  }

  getMeshes() {
    return this._meshes;
  }

  getMesh() {
    return this._mesh;
  }

  getSelectedMeshes() {
    return this._selectMeshes;
  }

  getPicking() {
    return this._picking;
  }

  getPickingSymmetry() {
    return this._pickingSym;
  }

  getSculptManager() {
    return this._sculptManager;
  }

  getStateManager() {
    return this._stateManager;
  }

  setMesh(mesh) {
    return this.setOrUnsetMesh(mesh);
  }

  setCanvasCursor(style) {
    this._canvas.style.cursor = style;
  }

  initGrid() {
    const grid = this._grid;
    grid.normalizeSize();
    const gridm = grid.getMatrix();
    mat4.translate(gridm, gridm, [0.0, -0.45, 0.0]);
    const scale = 2.5;
    mat4.scale(gridm, gridm, [scale, scale, scale]);
    this._grid.setShaderType(Enums.Shader.FLAT);
    grid.setFlatColor([0.04, 0.04, 0.04]);
  }

  setOrUnsetMesh(mesh, multiSelect) {
    if (!mesh) {
      this._selectMeshes.length = 0;
    } else if (!multiSelect) {
      this._selectMeshes.length = 0;
      this._selectMeshes.push(mesh);
    } else {
      const id = this.getIndexSelectMesh(mesh);
      if (id >= 0) {
        if (this._selectMeshes.length > 1) {
          this._selectMeshes.splice(id, 1);
          mesh = this._selectMeshes[0];
        }
      } else {
        this._selectMeshes.push(mesh);
      }
    }

    this._mesh = mesh;
    this.getGui().updateMesh();
    this.render();
    return mesh;
  }

  renderSelectOverRtt() {
    if (this._requestRender())
      this._drawFullScene = false;
  }

  _requestRender() {
    if (this._preventRender === true) return false; // render already requested for the next frame

    window.requestAnimationFrame(this.applyRender.bind(this));
    this._preventRender = true;
    return true;
  }

  render() {
    this._drawFullScene = true;
    this._requestRender();
  }

  applyRender() {
    this._preventRender = false;
    this.updateMatricesAndSort();

    const gl = this._gl;
    if (!gl) return;

    if (this._drawFullScene) this._drawScene();

    // gl.disable(gl.DEPTH_TEST);

    // gl.bindFramebuffer(gl.FRAMEBUFFER, this._rttMerge.getFramebuffer());
    // this._rttMerge.render(this); // merge + decode

    // render to screen
    // gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // this._rttOpaque.render(this); // fxaa

    // gl.enable(gl.DEPTH_TEST);

    if (this._sculptManager) this._sculptManager.postRender(); // draw sculpting gizmo stuffs (if needed)
  }

  _drawScene() {
    const gl = this._gl;
    const meshes = this._meshes;
    const nbMeshes = meshes.length;

    // /////////////
    // // CONTOUR 1/2
    // /////////////
    // gl.disable(gl.DEPTH_TEST);
    // const showContour = this._selectMeshes.length > 0 && this._showContour && ShaderLib[Enums.Shader.CONTOUR].color[3] > 0.0;
    // if (showContour) {
    //   gl.bindFramebuffer(gl.FRAMEBUFFER, this._rttContour.getFramebuffer());
    //   gl.clear(gl.COLOR_BUFFER_BIT);
    //   for (let s = 0, sel = this._selectMeshes, nbSel = sel.length; s < nbSel; ++s)
    //     sel[s].renderFlatColor(this);
    // }
    // gl.enable(gl.DEPTH_TEST);

    // /////////////
    // // OPAQUE PASS
    // /////////////
    // gl.bindFramebuffer(gl.FRAMEBUFFER, this._rttOpaque.getFramebuffer());
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // // grid
    // if (this._showGrid) this._grid.render(this);

    // (post opaque pass)
    let i = 0;
    for (i = 0; i < nbMeshes; ++i) {
      if (meshes[i].isTransparent()) break;
      meshes[i].render(this);
    }
    const startTransparent = i;
    if (this._meshPreview) this._meshPreview.render(this);

    // // background
    // if (this._background) this._background.render();

    // /////////////
    // // TRANSPARENT PASS
    // /////////////
    // gl.bindFramebuffer(gl.FRAMEBUFFER, this._rttTransparent.getFramebuffer());
    // gl.clear(gl.COLOR_BUFFER_BIT);

    // gl.enable(gl.BLEND);
    // gl.depthFunc(gl.LESS);

    for (i = 0; i < nbMeshes; ++i) {
      if (meshes[i].getShowWireframe())
        meshes[i].renderWireframe(this);
    }

    // gl.depthFunc(gl.LEQUAL);
    // gl.depthMask(false);
    // gl.enable(gl.CULL_FACE);

    for (i = startTransparent; i < nbMeshes; ++i) {
      // gl.cullFace(gl.FRONT);
      meshes[i].render(this);
      // gl.cullFace(gl.BACK);
      meshes[i].render(this);
    }

    // gl.disable(gl.CULL_FACE);

    // /////////////
    // // CONTOUR 2/2
    // /////////////
    // if (showContour) {
    //   this._rttContour.render(this);
    // }

    // gl.depthMask(true);
    // gl.disable(gl.BLEND);
  }

  /** Pre compute matrices and sort meshes */
  updateMatricesAndSort() {
    const meshes = this._meshes;
    const cam = this._camera;
    if (meshes.length > 0 && cam) {
      cam.optimizeNearFar(this.computeBoundingBoxScene());
    }

    for (let i = 0, nb = meshes.length; i < nb; ++i) {
      if (cam) meshes[i].updateMatrices(cam);
    }

    meshes.sort(Mesh.sortFunction);

    if (this._meshPreview && cam) this._meshPreview.updateMatrices(cam);
    if (this._grid && cam) this._grid.updateMatrices(cam);
  }

  initWebGL() {
    const attributes = {
      antialias: false,
      stencil: true
    };

    const canvas = document.getElementById('canvas');
    const gl = (this._gl = canvas.getContext('webgl', attributes) || canvas.getContext('experimental-webgl', attributes));
    if (!gl) {
      window.alert('Could not initialise WebGL. No WebGL, no SculptGL. Sorry.');
      return;
    }

    WebGLCaps.initWebGLExtensions(gl);
    if (!WebGLCaps.getWebGLExtension('OES_element_index_uint'))
      RenderData.ONLY_DRAW_ARRAYS = true;

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);

    gl.disable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);

    gl.disable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    gl.disable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(true);

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  /** Load textures (preload) */
  loadTextures() {
    const gl = this._gl;
    const ShaderMatcap = ShaderLib[Enums.Shader.MATCAP];
    const self = this;

    const loadTex = function (path, idMaterial) {
      const mat = new Image();
      mat.src = path;

      mat.onload = function () {
        ShaderMatcap.createTexture(gl, mat, idMaterial);
        self.render();
      };
    };

    for (let i = 0, mats = ShaderMatcap.matcaps, l = mats.length; i < l; ++i)
      loadTex(mats[i].path, i);

    this.initAlphaTextures();
  }

  initAlphaTextures() {
    const alphas = Picking.INIT_ALPHAS_PATHS;
    const names = Picking.INIT_ALPHAS_NAMES;
    for (let i = 0, nbA = alphas.length; i < nbA; ++i) {
      const am = new Image();
      am.src = 'resources/alpha/' + alphas[i];
      am.onload = this.onLoadAlphaImage.bind(this, am, names[i]);
    }
  }

  /** Called when the window is resized */
  onCanvasResize() {
    const viewport = this._viewport;
    const newWidth = viewport.clientWidth * this._pixelRatio;
    const newHeight = viewport.clientHeight * this._pixelRatio;

    this._canvasOffsetLeft = viewport.offsetLeft;
    this._canvasOffsetTop = viewport.offsetTop;
    this._canvasWidth = newWidth;
    this._canvasHeight = newHeight;

    this._canvas.width = newWidth;
    this._canvas.height = newHeight;

    this._gl.viewport(0, 0, newWidth, newHeight);
    if (this._camera) this._camera.onResize(newWidth, newHeight);
    // if (this._background) this._background.onResize(newWidth, newHeight);

    // if (this._rttContour) this._rttContour.onResize(newWidth, newHeight);
    // if (this._rttMerge) this._rttMerge.onResize(newWidth, newHeight);
    // if (this._rttOpaque) this._rttOpaque.onResize(newWidth, newHeight);
    // if (this._rttTransparent) this._rttTransparent.onResize(newWidth, newHeight);

    this.render();
  }

  computeRadiusFromBoundingBox(box) {
    const dx = box[3] - box[0];
    const dy = box[4] - box[1];
    const dz = box[5] - box[2];
    return 0.5 * Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  computeBoundingBoxMeshes(meshes) {
    const bound = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
    for (let i = 0, l = meshes.length; i < l; ++i) {
      if (!meshes[i].isVisible()) continue;
      const bi = meshes[i].computeWorldBound();
      if (bi[0] < bound[0]) bound[0] = bi[0];
      if (bi[1] < bound[1]) bound[1] = bi[1];
      if (bi[2] < bound[2]) bound[2] = bi[2];
      if (bi[3] > bound[3]) bound[3] = bi[3];
      if (bi[4] > bound[4]) bound[4] = bi[4];
      if (bi[5] > bound[5]) bound[5] = bi[5];
    }
    return bound;
  }

  computeBoundingBoxScene() {
    const scene = this._meshes.slice();
    if (this._grid) scene.push(this._grid);
    if (this._sculptManager) this._sculptManager.addSculptToScene(scene);
    return this.computeBoundingBoxMeshes(scene);
  }

  normalizeAndCenterMeshes(meshes) {
    const box = this.computeBoundingBoxMeshes(meshes);
    const scale = Utils.SCALE / vec3.dist([box[0], box[1], box[2]], [box[3], box[4], box[5]]);

    const mCen = mat4.create();
    mat4.scale(mCen, mCen, [scale, scale, scale]);
    mat4.translate(mCen, mCen, [
      -(box[0] + box[3]) * 0.5,
      -(box[1] + box[4]) * 0.5,
      -(box[2] + box[5]) * 0.5
    ]);

    for (let i = 0, l = meshes.length; i < l; ++i) {
      const mat = meshes[i].getMatrix();
      mat4.mul(mat, mCen, mat);
    }
  }

  addSphere() {
    // make a cube and subdivide it
    const mesh = new Multimesh(Primitives.createCube(this._gl));

    mesh.normalizeSize();
    this.subdivideClamp(mesh);
    return this.addNewMesh(mesh);
  }

  addCube() {
    const mesh = new Multimesh(Primitives.createCube(this._gl));

    mesh.normalizeSize();
    mat4.scale(mesh.getMatrix(), mesh.getMatrix(), [0.7, 0.7, 0.7]);
    this.subdivideClamp(mesh, true);
    return this.addNewMesh(mesh);
  }

  addCylinder() {
    const mesh = new Multimesh(Primitives.createCylinder(this._gl));
    mesh.normalizeSize();
    mat4.scale(mesh.getMatrix(), mesh.getMatrix(), [0.7, 0.7, 0.7]);
    this.subdivideClamp(mesh);
    return this.addNewMesh(mesh);
  }

  addTorus(preview) {
    const mesh = new Multimesh(
      Primitives.createTorus(
        this._gl,
        this._torusLength,
        this._torusWidth,
        this._torusRadius,
        this._torusRadial,
        this._torusTubular
      )
    );

    if (preview) {
      mesh.setShowWireframe(true);
      const scale = 0.3 * Utils.SCALE;
      mat4.scale(mesh.getMatrix(), mesh.getMatrix(), [scale, scale, scale]);
      this._meshPreview = mesh;
      return;
    }
    mesh.normalizeSize();
    this.subdivideClamp(mesh);
    this.addNewMesh(mesh);
  }

  subdivideClamp(mesh, linear) {
    Subdivision.LINEAR = !!linear;
    while (mesh.getNbFaces() < 50000)
      mesh.addLevel();
    // keep at max 4 multires
    mesh._meshes.splice(0, Math.min(mesh._meshes.length - 4, 4));
    mesh._sel = mesh._meshes.length - 1;
    Subdivision.LINEAR = false;
  }

  addNewMesh(mesh) {
    this._meshes.push(mesh);
    this._stateManager.pushStateAdd(mesh);
    this.setMesh(mesh);
    return mesh;
  }

  /*
  loadScene(fileData, fileType) {
    var newMeshes;
    if (fileType === 'obj') newMeshes = Import.importOBJ(fileData, this._gl);
    else if (fileType === 'sgl') newMeshes = Import.importSGL(fileData, this._gl, this);
    else if (fileType === 'stl') newMeshes = Import.importSTL(fileData, this._gl);
    else if (fileType === 'ply') newMeshes = Import.importPLY(fileData, this._gl);

    var nbNewMeshes = newMeshes.length;
    if (nbNewMeshes === 0) {
      return;
    }

    var meshes = this._meshes;
    for (var i = 0; i < nbNewMeshes; ++i) {
      var mesh = newMeshes[i] = new Multimesh(newMeshes[i]);

      if (!this._vertexSRGB && mesh.getColors()) {
        Utils.convertArrayVec3toSRGB(mesh.getColors());
      }

      mesh.init();
      mesh.initRender();
      meshes.push(mesh);
    }

    if (this._autoMatrix) {
      this.normalizeAndCenterMeshes(newMeshes);
    }

    this._stateManager.pushStateAdd(newMeshes);
    this.setMesh(meshes[meshes.length - 1]);
    this.resetCameraMeshes(newMeshes);
    return newMeshes;
  }
  */

  getFileType(url) {
    const lower = url.toLowerCase();
    if (lower.endsWith('.obj')) return 'obj';
    if (lower.endsWith('.sgl')) return 'sgl';
    if (lower.endsWith('.stl')) return 'stl';
    if (lower.endsWith('.ply')) return 'ply';
    return;
  }

  clearScene() {
    if (this.getStateManager()) this.getStateManager().reset();
    this.getMeshes().length = 0;
    if (this.getCamera()) this.getCamera().resetView();
    this.setMesh(null);
    this._action = Enums.Action.NOTHING;
  }

  deleteCurrentSelection() {
    if (!this._mesh) return;

    this.removeMeshes(this._selectMeshes);
    this._stateManager.pushStateRemove(this._selectMeshes.slice());
    this._selectMeshes.length = 0;
    this.setMesh(null);
  }

  removeMeshes(rm) {
    const meshes = this._meshes;
    for (let i = 0; i < rm.length; ++i)
      meshes.splice(this.getIndexMesh(rm[i]), 1);
  }

  getIndexMesh(mesh, select) {
    const meshes = select ? this._selectMeshes : this._meshes;
    const id = mesh.getID();
    for (let i = 0, nbMeshes = meshes.length; i < nbMeshes; ++i) {
      const testMesh = meshes[i];
      if (testMesh === mesh || testMesh.getID() === id)
        return i;
    }
    return -1;
  }

  getIndexSelectMesh(mesh) {
    return this.getIndexMesh(mesh, true);
  }

  /** Replace a mesh in the scene */
  replaceMesh(mesh, newMesh) {
    const index = this.getIndexMesh(mesh);
    if (index >= 0) this._meshes[index] = newMesh;
    if (this._mesh === mesh) this.setMesh(newMesh);
  }

  duplicateSelection() {
    const meshes = this._selectMeshes.slice();
    let mesh = null;
    for (let i = 0; i < meshes.length; ++i) {
      mesh = meshes[i];
      const copy = new MeshStatic(mesh.getGL());
      copy.copyData(mesh);
      this.addNewMesh(copy);
    }
    this.setMesh(mesh);
  }

  
  onLoadAlphaImage(img, name, tool) {
    var can = document.createElement('canvas');
    can.width = img.width;
    can.height = img.height;

    var ctx = can.getContext('2d');
    ctx.drawImage(img, 0, 0);
    var u8rgba = ctx.getImageData(0, 0, img.width, img.height).data;
    var u8lum = u8rgba.subarray(0, u8rgba.length / 4);
    for (var i = 0, j = 0, n = u8lum.length; i < n; ++i, j += 4)
      u8lum[i] = Math.round((u8rgba[j] + u8rgba[j + 1] + u8rgba[j + 2]) / 3);

    name = Picking.addAlpha(u8lum, img.width, img.height, name)._name;

    var entry = {};
    entry[name] = name;
    this.getGui().addAlphaOptions(entry);
    if (tool && tool._ctrlAlpha)
      tool._ctrlAlpha.setValue(name);
  }
  

  resetCameraMeshes(meshes) {
    if (!this._camera) return;
    if (!meshes) meshes = this._meshes;

    if (meshes.length > 0) {
      const pivot = [0.0, 0.0, 0.0];
      const box = this.computeBoundingBoxMeshes(meshes);
      let zoom = 0.8 * this.computeRadiusFromBoundingBox(box);
      zoom *= this._camera.computeFrustumFit();

      vec3.set(
        pivot,
        (box[0] + box[3]) * 0.5,
        (box[1] + box[4]) * 0.5,
        (box[2] + box[5]) * 0.5
      );
      this._camera.setAndFocusOnPivot(pivot, zoom);
    } else {
      this._camera.resetView();
    }
    this.render();
  }
}

export default Scene;
