import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

import * as dat from 'lil-gui';
// import fragmentShader from './shaders/fragment.glsl';
// import vertexShader from './shaders/vertex.glsl';
import * as FIK from 'fullik';

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// Debug
const gui = new dat.GUI();
gui.hide();
if (window.location.hash === '#debug') {
  gui.show();
}

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

const lights = [];
lights[0] = new THREE.DirectionalLight(0xffffff, 1); //new THREE.SpotLight( 0xffffff, 1, 0, Math.PI / 2 );
lights[1] = new THREE.PointLight(0xff8822, 1, 0);
lights[2] = new THREE.PointLight(0x2288ff, 1, 0);

lights[0].position.set(0, 200, 0);
lights[1].position.set(100, 200, 100);
lights[2].position.set(-100, -200, -100);

scene.add(lights[0]);
scene.add(lights[1]);
scene.add(lights[2]);

lights[0].castShadow = true;
const s = lights[0].shadow;
s.mapSize.setScalar(2048);
s.camera.top = s.camera.right = 150;
s.camera.bottom = s.camera.left = -150;
s.camera.near = 100;
s.camera.far = 400;
s.bias = -0.0001;

const axesHelper = new THREE.AxesHelper();
scene.add(axesHelper);

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial();
const mesh = new THREE.Mesh(geometry, material);
// scene.add(mesh);

const mousePosition = {
  x: 0,
  y: 0,
};

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  // material.uniforms.viewport.value = new THREE.Vector2(
  //   sizes.width,
  //   sizes.height
  // );

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

window.addEventListener('mousemove', (e) => {
  mousePosition.x = e.clientX;
  mousePosition.y = e.clientY;
  // material.uniforms.uMouse.value = new THREE.Vector2(
  //   mousePosition.x,
  //   mousePosition.y
  // );
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  60,
  sizes.width / sizes.height,
  0.1,
  2000
);
camera.position.set(0, 30, 100);
lights[0].position.set(40, 100, 200);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

function orbitalMove(e) {
  controls.enabled = !e.value;
}

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x222322, 1);

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

function addTarget(position) {
  //https://threejs.org/examples/?q=Transform#misc_controls_transform

  let n = {
    mesh: new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 6, 4),
      new THREE.MeshStandardMaterial({ color: 0xffff00, wireframe: true })
    ),
    control: new TransformControls(camera, renderer.domElement),
  };

  n.mesh.castShadow = true;
  n.mesh.receiveShadow = false;

  scene.add(n.mesh);
  n.mesh.position.copy(position);
  n.control.addEventListener('change', updateSolver);
  n.control.addEventListener('dragging-changed', orbitalMove);

  n.control.attach(n.mesh);
  n.control.setSize(0.75);
  //n.control.setMode('rotate')
  //n.control.setMode('scale')
  scene.add(n.control);

  n.position = n.mesh.position;

  targets.push(n);

  window.targets = targets;
}

const solver = new FIK.Structure3D(scene, THREE);
const chain = new FIK.Chain3D(0x999999);
const defaultBoneDirection = FIK.Z_NEG;
const defaultBoneLength = 0.5;
const startLoc = new FIK.V3(0, 30, -40);
const endLoc = startLoc.clone();
endLoc.y -= defaultBoneLength;
var basebone = new FIK.Bone3D(startLoc, endLoc);
chain.addBone(basebone);
chain.fixedBaseMode = false;
// debugger;
for (var j = 0; j < 1000; j++) {
  if (j % 2 == 0) {
    chain.addConsecutiveBone(
      FIK.Y_NEG,
      defaultBoneLength,
      'global',
      FIK.Z_AXE,
      120,
      120,
      FIK.Y_NEG
    );
  } else chain.addConsecutiveBone(FIK.Y_NEG, defaultBoneLength);
}

let targets = [];
addTarget(new THREE.Vector3(0, 30, 0));
const target = targets[0].position;
solver.add(chain, target, true);
solver.update();

function updateSolver() {
  console.log(solver.chains[0]?.bones[0].start);
  solver.update();
}

tick();
