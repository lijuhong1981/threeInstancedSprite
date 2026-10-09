# InstancedSprite

Three.js 自带的 `Sprite` 不支持 GPU 实例化渲染。当场景中需要同时展示大量标签、图标或提示时，逐个绘制 `Sprite` 会产生大量 draw call，导致帧率明显下降。

`InstancedSprite` 基于 `InstancedBufferGeometry` + 自定义 `ShaderMaterial`（或 TSL `NodeMaterial`）实现实例化渲染。**所有 Sprite 的图片打包进纹理图集，合并为极少数 draw call**，极大提升大批量标签的渲染效率。

## 特性

- 🚀 **GPU 实例化**：基于 `InstancedBufferGeometry`，数千个 Sprite 仅需一次 draw call
- 🏷️ **纹理图集合批**：不同图片打包进同一图集，一个图集（一个 Mesh）一次 draw call；图集满自动新建
- ✏️ **属性自动同步**：直接修改 Sprite 的 `position` / `rotation` / `scale` / `color` 等属性，每帧 `update()` 时通过脏检查自动上传至 GPU，无需手动刷新
- 🎯 **射线拾取**：内置射线检测，可直接用 `Raycaster` 拾取到具体的 `InstancedSprite` 实例
- 🖼️ **像素级透明**：片元着色器自动丢弃完全透明的像素
- 🎨 **双渲染后端**：同时支持 WebGL（GLSL `ShaderMaterial`）与 WebGPU（TSL `NodeMaterial`）
- 📏 **动态扩容**：实例缓冲区按需自动扩容，实例数量无硬性上限

## 安装

```bash
npm install @lijuhong1981/three.instancedsprite
```

依赖 `three`（`>= 0.171.0`）。若使用 WebGPU / TSL 材质，需从 `three/webgpu` 引入相关构建。

## 使用

```js
import * as THREE from "three";
import { InstancedSpriteCollection } from "@lijuhong1981/three.instancedsprite";

// 初始化（继承自 Object3D，直接加入场景）
const collection = new InstancedSpriteCollection();
scene.add(collection);

// 若使用 WebGPURenderer，通过 useNodeMaterial 启用 TSL 的 NodeMaterial
// const collection = new InstancedSpriteCollection({ useNodeMaterial: true });

// 图集可配置（初始/最大边长、子图间距），默认自动扩容到 8192
// const collection = new InstancedSpriteCollection({ maxSize: 4096 });

// 每帧更新：内部做脏检查，把发生变化的属性同步到 GPU
const onAnimate = () => {
    window.requestAnimationFrame(onAnimate);
    collection.update();
};

// 添加一个 Sprite
const sprite = collection.add({
    position: [100, 100, 100],   // 位置（世界空间）
    rotation: 0,                 // 旋转（弧度）
    scale: 1.0,                  // 缩放
    sizeAttenuation: false,      // 尺寸是否跟随相机深度变化（默认 true）
    center: [0.5, 0],            // 中心锚点（0-1，默认 (0.5, 0.5)）
    color: 0xff0000,             // 颜色（默认 0xffffff）
    opacity: 0.5,                // 不透明度（0-1，默认 1）
    image: './res/icon.png',     // 图片地址，相同 image 会合并到同一个 Mesh 一次渲染
});

// 运行时修改属性（无需手动刷新，update() 会自动同步）
sprite.position.set(200, 100, 0);
sprite.color.set(0x00ff00);
sprite.show = false;             // 隐藏（等同于 sprite.visible）

// 移除
sprite.remove();
// 或
collection.remove(sprite);

// 清空所有 Sprite
collection.clear();

// 射线检测
const ndc = new THREE.Vector2(/* ... */);
raycaster.setFromCamera(ndc, camera);
const intersects = raycaster.intersectObject(collection);
if (intersects.length > 0) {
    const pickedSprite = intersects[0].object; // 拾取到的 InstancedSprite
    const instanceId = intersects[0].instanceId; // 实例索引
}
```

## 主要 API

| 类 | 说明 |
| --- | --- |
| `InstancedSpriteCollection` | 继承自 `Object3D`，批量管理所有 Sprite；使用纹理图集合并 draw call |
| `InstancedSprite` | 数据模型类，保存单个 Sprite 的全部属性；**不继承 `Object3D`**，不能直接加入 Scene，由 Collection 统一渲染 |
| `InstancedSpriteMesh` | 继承自 `Mesh`，基于 `InstancedBufferGeometry`，一张图集对应一个 Mesh，由其统一绘制 |
| `InstancedSpriteMaterial` | 继承自 `ShaderMaterial`，以 instanced attribute 形式接收每个 Sprite 的属性（WebGL） |
| `InstancedSpriteNodeMaterial` | 继承自 `NodeMaterial`，基于 TSL 实现，功能与 `InstancedSpriteMaterial` 一致（WebGPU） |

> 以上每个类都有对应的 `Billboard*` 别名导出（如 `BillboardCollection`、`Billboard`），语义上表示「始终面向相机的广告牌/标签」。

### InstancedSpriteCollection

- `add(options)` → `InstancedSprite`：添加并返回一个 Sprite
- `remove(sprite)`：移除指定 Sprite
- `clear()`：移除所有 Sprite
- `get(index)` / `getByUuid(uuid)`：按索引 / uuid 获取
- `forEach(callback)`：遍历所有 Sprite
- `update()`：每帧调用，同步属性变化
- `raycast(raycaster, intersects)`：射线拾取
- `instancedSprites`：Sprite 数组（只读）；`size`：数量（只读）
- `depthTest`：深度测试开关（默认 `true`；关闭后所有 Sprite 始终渲染在最前，适合 UI 元素）

### InstancedSprite 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `position` | `Vector3` | `(0, 0, 0)` | 世界坐标位置 |
| `scale` | `number` | `1` | 缩放 |
| `rotation` | `number` | `0` | 旋转（弧度）；可用 `rotationDegrees` 以角度读写 |
| `sizeAttenuation` | `boolean` | `true` | 尺寸是否跟随相机深度变化 |
| `center` | `Vector2` | `(0.5, 0.5)` | 锚点中心（0-1） |
| `color` | `Color` | `0xffffff` | 颜色 |
| `opacity` | `number` | `1` | 不透明度（0-1） |
| `show` / `visible` | `boolean` | `true` | 是否显示 |
| `image` | `string \| HTMLImageElement \| HTMLCanvasElement` | - | 图片资源 |
| `imageSize` / `imageWidth` / `imageHeight` | - | - | 图片尺寸，图片加载完成后可用（只读） |
| `userData` | `object` | `{}` | 用户自定义数据 |
| `uuid` | `string` | - | 唯一标识（只读） |

## 工作原理

1. `InstancedSpriteCollection.add()` 创建 `InstancedSprite` 数据对象，并将其 `image` 打包进纹理图集（同一图片只打包一次）。
2. `InstancedSpriteMesh` 持有 `InstancedBufferGeometry`，为每个实例分配一组 instanced attribute（位置+显示、锚点+尺寸、缩放+旋转+衰减、颜色+透明度、拾取颜色）。
3. 顶点着色器根据实例属性计算 billboard 位置（对齐、旋转、透视缩放），片元着色器采样纹理并应用颜色 / 透明度。
4. 每帧调用 `update()`：仅当属性实际发生变化（脏检查）时才更新对应缓冲区，减少 CPU→GPU 传输开销；缓冲区按需自动扩容。

## [API 文档](./API.md)
