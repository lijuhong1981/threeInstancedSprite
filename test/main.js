import * as THREE from 'three';
import { InstancedSpriteCollection } from '../index.js';

// ===================== 渲染器 / 场景 / 相机 =====================
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x14162a);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 0, 140);

// ===================== 生成测试图标（canvas，无需外部资源）=====================
function makeIcon(color, label, size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.floor(size * 0.42)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, size / 2, size / 2);
    return canvas;
}

// 24 种不同颜色/尺寸的图标，用于验证图集打包（小图集下会溢出到多个图集）
const icons = [];
for (let i = 0; i < 24; i++) {
    const color = new THREE.Color().setHSL(i / 24, 0.8, 0.55);
    const size = 40 + (i % 6) * 12; // 40 ~ 100px
    icons.push(makeIcon('#' + color.getHexString(), String.fromCharCode(65 + i), size));
}

// ===================== 集合（支持切换图集大小）=====================
let useSmallAtlas = false;
let collection = null;
let picked = null;

function createCollection() {
    // 小图集：初始 128、上限 256，24 种图标会溢出到多个图集 -> 多个 Mesh
    const options = useSmallAtlas ? { initialSize: 128, maxSize: 256, padding: 2 } : {};
    return new InstancedSpriteCollection(options);
}

function randomSprite() {
    return {
        position: [(Math.random() - 0.5) * 180, (Math.random() - 0.5) * 180, (Math.random() - 0.5) * 180],
        image: icons[(Math.random() * icons.length) | 0],
        scale: 0.6 + Math.random() * 1.2,
        rotation: Math.random() * Math.PI * 2,
        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.6),
        opacity: 0.5 + Math.random() * 0.5,
        sizeAttenuation: true,
    };
}

function rebuild() {
    if (collection) {
        scene.remove(collection);
        collection.dispose(); // 释放旧 GPU 资源
    }
    collection = createCollection();
    if (!useSmallAtlas) collection.reserve(10000);
    scene.add(collection);
    for (let i = 0; i < 1500; i++) collection.add(randomSprite());
    picked = null;
}
rebuild();

// ===================== 拾取（射线检测）=====================
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

renderer.domElement.addEventListener('pointerdown', (e) => {
    ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const intersects = raycaster.intersectObject(collection);

    if (picked && picked.userData.origColor !== undefined) picked.color.setHex(picked.userData.origColor);
    picked = null;

    if (intersects.length > 0) {
        picked = intersects[0].object;
        if (picked.userData.origColor === undefined) picked.userData.origColor = picked.color.getHex();
        picked.color.set(0xffffff);
    }
});

// ===================== 简单鼠标拖拽轨道 =====================
let dragging = false;
let px = 0, py = 0;
let yaw = 0, pitch = 0;
const radius = 140;

renderer.domElement.addEventListener('pointerdown', (e) => { dragging = true; px = e.clientX; py = e.clientY; });
window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    yaw -= (e.clientX - px) * 0.005;
    pitch -= (e.clientY - py) * 0.005;
    pitch = Math.max(-1.5, Math.min(1.5, pitch));
    px = e.clientX; py = e.clientY;
});
window.addEventListener('pointerup', () => { dragging = false; });

function updateCamera() {
    camera.position.set(
        radius * Math.cos(pitch) * Math.sin(yaw),
        radius * Math.sin(pitch),
        radius * Math.cos(pitch) * Math.cos(yaw),
    );
    camera.lookAt(0, 0, 0);
}

// ===================== UI =====================
const countEl = document.getElementById('count');
const drawcallsEl = document.getElementById('drawcalls');
const fpsEl = document.getElementById('fps');
const depthTestBtn = document.getElementById('depthTestBtn');
const depthWriteBtn = document.getElementById('depthWriteBtn');
const smallAtlasBtn = document.getElementById('smallAtlasBtn');

document.getElementById('addBtn').addEventListener('click', () => {
    for (let i = 0; i < 500; i++) collection.add(randomSprite());
});
document.getElementById('removeBtn').addEventListener('click', () => {
    const remove = collection.instancedSprites.slice(-500);
    for (const s of remove) collection.remove(s);
});
document.getElementById('clearBtn').addEventListener('click', () => collection.clear());

smallAtlasBtn.addEventListener('click', () => {
    useSmallAtlas = !useSmallAtlas;
    rebuild();
    smallAtlasBtn.textContent = `小图集: ${useSmallAtlas ? 'on' : 'off'}`;
});

function toggleButton(btn, getter, setter) {
    const next = !getter();
    setter(next);
    btn.textContent = `${btn.dataset.name}: ${next ? 'on' : 'off'}`;
}
depthTestBtn.dataset.name = 'depthTest';
depthWriteBtn.dataset.name = 'depthWrite';
depthTestBtn.addEventListener('click', () => toggleButton(depthTestBtn, () => collection.depthTest, (v) => collection.depthTest = v));
depthWriteBtn.addEventListener('click', () => toggleButton(depthWriteBtn, () => collection.depthWrite, (v) => collection.depthWrite = v));

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ===================== 动画循环 =====================
let frame = 0;
let lastStat = performance.now();
let frames = 0;

function animate() {
    requestAnimationFrame(animate);
    frame++;
    frames++;

    // 让一部分 sprite 旋转 / 上下移动，测试脏检查 + 增量上传
    collection.forEach((s, i) => {
        if (i % 20 === 0) s.rotation += 0.03;
        if (i % 50 === 0) s.position.y = Math.sin(frame * 0.02 + i) * 40;
    });

    updateCamera();
    collection.update();
    renderer.render(scene, camera);

    const now = performance.now();
    if (now - lastStat >= 500) {
        fpsEl.textContent = Math.round(frames * 1000 / (now - lastStat));
        frames = 0;
        lastStat = now;
        countEl.textContent = collection.size;
        drawcallsEl.textContent = renderer.info.render.calls;
    }
}
animate();
