import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as TWEEN from '@tweenjs/tween.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfafafa);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.localClippingEnabled = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Yorug'liklar
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 10, 5);
dirLight.castShadow = true;
scene.add(dirLight);

const pointLight = new THREE.PointLight(0xffffff, 1.2, 50);
pointLight.position.set(-5, 8, -5);
pointLight.castShadow = true;
scene.add(pointLight);

// Stol
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.9, metalness: 0 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Shelf (laboratoriya ko'rinishi uchun)
const shelf = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.2, 2),
    new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.3, metalness: 0.2 })
);
shelf.position.set(0, 0.1, -5);
shelf.receiveShadow = true;
shelf.castShadow = true;
scene.add(shelf);

// Clipping planes
const probirkaClip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
const kolbaClip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);

let kolba = null, probirka = null;
let kolbaSuv = null, probirkaSuv = null;
let probirkaSolid = null;
let kolbaHeight = 0, probirkaHeight = 0;
let initialPos = new THREE.Vector3(-2, 0, 0);
let suvNisbati = 0.5; // Probirka initial 50% to'la
let kolbaNisbati = 0; // Kolba initial bo'sh

// Parametrlar (GUI uchun)
const params = {
    modda: 'suyuqlik',
    rang: '#ff0055',
    qattiqSon: 50
};

const loader = new GLTFLoader();
loader.load('models/chemistry_bottles.glb', (gltf) => {
    const model = gltf.scene;
    model.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            child.material = new THREE.MeshPhysicalMaterial({
                color: 0xffffff, // Oq rang bazasi
                roughness: 0, // Silliq
                metalness: 0,
                transmission: 1, // Shaffoflik
                thickness: 0.5, // Refraction
                transparent: true,
                opacity: 1,
                side: THREE.DoubleSide
            });

            if (child.name === "Object_4") { // Kolba
                kolba = child;
                const box = new THREE.Box3().setFromObject(kolba);
                const size = new THREE.Vector3();
                box.getSize(size);
                kolbaHeight = size.y;
                kolba.position.set(2, kolbaHeight / 2, 0);
                scene.add(kolba);

                const waterGeo = new THREE.CylinderGeometry(0.7, 0.7, kolbaHeight, 32);
                const waterMat = new THREE.MeshPhysicalMaterial({
                    color: 0x00ccff,
                    transparent: true,
                    opacity: 0.6,
                    metalness: 0.2,
                    roughness: 0.3,
                    clippingPlanes: [kolbaClip],
                    side: THREE.DoubleSide
                });
                kolbaSuv = new THREE.Mesh(waterGeo, waterMat);
                kolba.add(kolbaSuv);
                kolbaClip.constant = -kolbaHeight * (1 - kolbaNisbati);
            }

            if (child.name === "Object_10") { // Probirka
                probirka = child;
                const box = new THREE.Box3().setFromObject(probirka);
                const size = new THREE.Vector3();
                box.getSize(size);
                probirkaHeight = size.y;
                probirka.geometry.translate(0, -probirkaHeight / 2, 0);
                initialPos.y = probirkaHeight; // Pastga tushmasligi uchun to'g'rilandi
                probirka.position.copy(initialPos);
                scene.add(probirka);

                updateProbirkaModda();
            }

            if (child.name !== "Object_4" && child.name !== "Object_10") child.visible = false;
        }
    });
});

// Dblclick hodisasi
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('dblclick', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0 && intersects[0].object.parent === probirka) boshlashAnimatsiya();
});

function boshlashAnimatsiya() {
    if (!probirka || !kolba) return;

    const kolbaBox = new THREE.Box3().setFromObject(kolba);
    const targetX = kolba.position.x - 0.1;
    const targetY = kolbaBox.max.y + 0.3;

    // 1-bosqich: Borish va egilish boshlanishi
    new TWEEN.Tween(probirka.position)
        .to({ x: targetX, y: targetY }, 1500)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();

    new TWEEN.Tween(probirka.rotation)
        .to({ z: -Math.PI / 6 }, 1500)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onComplete(() => {
            // 2-bosqich: To'liq egilish va to'kilish
            new TWEEN.Tween(probirka.rotation)
                .to({ z: -Math.PI * 0.85 }, 2500) // 155 daraja ~ PI*0.85
                .easing(TWEEN.Easing.Cubic.InOut)
                .onUpdate(() => {
                    if (probirka.rotation.z < -Math.PI / 2 && suvNisbati > 0) {
                        suvNisbati -= 0.001; // Probirka suvi kamayadi
                        kolbaNisbati += 0.001; // Kolba suvi oshadi
                        if (kolbaSuv) kolbaSuv.material.color.lerp(new THREE.Color(params.rang), 0.005); // Rang aralashishi
                    }
                })
                .onComplete(() => {
                    // 3-bosqich: Qaytish
                    setTimeout(() => {
                        new TWEEN.Tween(probirka.rotation).to({ z: 0 }, 1000).start();
                        new TWEEN.Tween(probirka.position).to({ x: initialPos.x, y: initialPos.y }, 1500).start();
                    }, 1000);
                })
                .start();
        })
        .start();
}

// GUI
const gui = new window.GUI({ width: 300 });
gui.title('Kimyo Laboratoriyasi Moddalari');

const moddaFolder = gui.addFolder('Probirka Moddasi');
moddaFolder.add(params, 'modda', ['suyuqlik', 'qattiq']).name('Modda Turi').onChange(updateProbirkaModda);
moddaFolder.addColor(params, 'rang').name('Rang').onChange(updateProbirkaModda);
moddaFolder.add(params, 'qattiqSon', 10, 200, 10).name('Qattiq Zarralar Soni').onChange(updateProbirkaModda);

const tajribaFolder = gui.addFolder('Tajriba Moddalari');
tajribaFolder.add({ addH2SO4: () => console.log('H₂SO₄ qo\'shildi') }, 'addH2SO4').name('H₂SO₄ Qo\'shish');
tajribaFolder.add({ addNaOH: () => console.log('NaOH qo\'shildi') }, 'addNaOH').name('NaOH Qo\'shish');
tajribaFolder.add({ addSalt: () => console.log('Tuz qo\'shildi') }, 'addSalt').name('Tuz Qo\'shish');

// Modda update
function updateProbirkaModda() {
    if (!probirka) return;

    if (probirkaSuv) probirka.remove(probirkaSuv);
    if (probirkaSolid) probirka.remove(probirkaSolid);
    probirkaSuv = null;
    probirkaSolid = null;

    const box = new THREE.Box3().setFromObject(probirka);
    const size = new THREE.Vector3();
    box.getSize(size);

    if (params.modda === 'suyuqlik') {
        const liquidGeo = new THREE.CylinderGeometry(0.3, 0.3, size.y, 32);
        const liquidMat = new THREE.MeshPhysicalMaterial({
            color: params.rang,
            transparent: true,
            opacity: 0.8,
            metalness: 0.1,
            roughness: 0.2,
            clippingPlanes: [probirkaClip],
            side: THREE.DoubleSide
        });
        probirkaSuv = new THREE.Mesh(liquidGeo, liquidMat);
        probirka.add(probirkaSuv);
        probirkaClip.constant = -probirkaHeight * (1 - suvNisbati);
    } else if (params.modda === 'qattiq') {
        const solidGeo = new THREE.SphereGeometry(0.05, 8, 8);
        const solidMat = new THREE.MeshPhysicalMaterial({
            color: params.rang,
            metalness: 0.5,
            roughness: 0.4
        });
        probirkaSolid = new THREE.InstancedMesh(solidGeo, solidMat, params.qattiqSon);
        const dummy = new THREE.Object3D();
        for (let i = 0; i < params.qattiqSon; i++) {
            dummy.position.set(
                (Math.random() - 0.5) * 0.5,
                -size.y / 2 + Math.random() * (size.y * 0.6),
                (Math.random() - 0.5) * 0.5
            );
            dummy.updateMatrix();
            probirkaSolid.setMatrixAt(i, dummy.matrix);
        }
        probirkaSolid.instanceMatrix.needsUpdate = true;
        probirka.add(probirkaSolid);
    }
}

function animate(time) {
    requestAnimationFrame(animate);
    TWEEN.update(time);

    // Clipping update
    if (probirka && probirkaSuv) {
        const gravityNormal = new THREE.Vector3(0, 1, 0);
        probirkaClip.normal.copy(gravityNormal).applyQuaternion(probirka.quaternion.clone().invert());
        probirkaClip.constant = suvNisbati * probirkaHeight / 2;
    }

    if (kolba && kolbaSuv) {
        kolbaClip.constant = kolbaNisbati * kolbaHeight / 2;
    }

    controls.update();
    renderer.render(scene, camera);
}
animate();