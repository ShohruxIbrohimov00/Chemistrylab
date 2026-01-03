// main2.js — GLTF modelini katta stol ustida to‘g‘ri joylashtirish
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff); // Sof oq fon

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 8, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 50;

// Yorug'liklar
scene.add(new THREE.AmbientLight(0xffffff, 1.0));

const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

const backLight = new THREE.DirectionalLight(0xffffff, 1.0);
backLight.position.set(-10, 15, -10);
scene.add(backLight);

// Stol — katta va real maktab laboratoriya stoli rangida
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 20), // Katta stol
    new THREE.MeshStandardMaterial({
        color: 0x8d6e63,      // Yog'och rangi (real maktab stoli)
        roughness: 0.9,
        metalness: 0.0
    })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
floor.position.y = 0; // Stol yuzasi 0 darajada
scene.add(floor);

// GLTF modelini yuklash
const loader = new GLTFLoader();
loader.load('chemistrylab/models/chemistry_bottles.glb', (gltf) => {
    const model = gltf.scene;

    // Modelni markazlashtirish
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    model.position.sub(center); // Markazni 0 ga olib kelish
    model.scale.setScalar(2.0); // Katta stol uchun mos o'lcham

    // Pastki qismini stolga tegizish
    model.position.y = size.y / 20; // Pastki qismi y = 0 (stol yuzasi) da bo'ladi

    // Barcha meshlarni ko'rsatish va yorqin qilish
    model.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.material) {
                child.material.envMapIntensity = 1.5;
                child.material.needsUpdate = true;
            }
        }
    });

    scene.add(model);

    console.log("Model to'liq yuklandi va stol ustiga to'g'ri joylashtirildi!");
}, undefined, (err) => {
    console.error("Model yuklanmadi:", err);
});

// Animatsiya tsikli
function animate(time) {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Resize hodisasi
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});