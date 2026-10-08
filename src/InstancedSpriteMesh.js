import Check from "@lijuhong1981/jscheck/src/Check.js";
import { BufferAttribute, InstancedBufferAttribute, InstancedBufferGeometry, Mesh, Raycaster, Texture } from "three";
import InstancedSprite from "./InstancedSprite.js";
import InstancedSpriteMaterial from "./InstancedSpriteMaterial.js";
import InstancedSpriteNodeMaterial from "./InstancedSpriteNodeMaterial.js";

/**
 * @import InstancedSpriteCollection from "./InstancedSpriteCollection.js";
*/

/**
 * 顶点数据，定义了一个单位正方形的四个顶点位置和UV坐标，以及组成两个三角形的索引
 * @ignore
*/
const positions = new Float32Array([
    -0.5, -0.5, 0,
    0.5, -0.5, 0,
    0.5, 0.5, 0,
    -0.5, 0.5, 0,
]);
const uvs = new Float32Array([
    0, 0,
    1, 0,
    1, 1,
    0, 1,
]);
const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
const geometry = new InstancedBufferGeometry();
geometry.setAttribute("position", new BufferAttribute(positions, 3));
geometry.setAttribute("uv", new BufferAttribute(uvs, 2));
geometry.setIndex(new BufferAttribute(indices, 1));
// geometry.computeVertexNormals();

// --- 定义InstancedSpriteMaterial使用的attribute名称常量 ---
const aPositionAndShow = 'aPositionAndShow';
const aCenterAndSize = 'aCenterAndSize';
const aScaleAndRotationAndSizeAttenuation = 'aScaleAndRotationAndSizeAttenuation';
const aColorAndOpacity = 'aColorAndOpacity';
const aPickColorAndEnabled = 'aPickColorAndEnabled';
/**
 * InstancedSpriteMaterial使用的attribute名称常量与itemSize大小，InstancedSpriteMesh会根据名称和itemSize创建InstancedBufferAttribute
 * @type {Object<string, number>}
 * @readonly
 * @ignore
*/
const AttributesItemSize = Object.freeze({
    aPositionAndShow: 4,
    aCenterAndSize: 4,
    aScaleAndRotationAndSizeAttenuation: 3,
    aColorAndOpacity: 4,
    aPickColorAndEnabled: 4,
    aUvRect: 4,
});
/**
 * 将指定实例的属性片段标记为需要更新，仅上传该实例对应的数据范围（增量上传）
 * @param {InstancedSpriteMesh} mesh
 * @param {string} name - attribute名称
 * @param {number} index - 实例索引
 * @param {number} itemSize - 单个实例占用的float数量
 * @ignore
*/
function markUpdateRange(mesh, name, index, itemSize) {
    const attribute = mesh.geometry.attributes[name];
    attribute.addUpdateRange(index * itemSize, itemSize);
    attribute.needsUpdate = true;
}
/**
 * 将指定实例属性标记为全量更新（整块重传）
 * @param {InstancedSpriteMesh} mesh
 * @param {string} name - attribute名称
 * @ignore
*/
function markFullUpdate(mesh, name) {
    const attribute = mesh.geometry.attributes[name];
    attribute.clearUpdateRanges();
    attribute.needsUpdate = true;
}
/**
 * 检查并更新一个InstancedSprite实例的数据到对应的InstancedBufferAttribute位置
 * @param {InstancedSpriteMesh} mesh
 * @param {InstancedSprite} sprite
 * @ignore
*/
function checkAndUpdateInstancedSprite(mesh, sprite) {
    const attributesData = mesh._attributesData;
    const index = sprite._instanceIndex;

    const positionChanged = (sprite._position.equals(sprite.position) === false);
    const showChanged = (sprite._show !== sprite.show);
    const centerChanged = (sprite._center.equals(sprite.center) === false);
    const imageSizeChanged = (sprite._imageSize.equals(sprite.imageSize) === false);
    const scaleChanged = (sprite._scale !== sprite.scale);
    const rotationChanged = (sprite._rotation !== sprite.rotation);
    const sizeAttenuationChanged = (sprite._sizeAttenuation !== sprite.sizeAttenuation);
    const colorChanged = (sprite._color.equals(sprite.color) === false);
    const opacityChanged = (sprite._opacity !== sprite.opacity);
    const pickColorChanged = (sprite._pickColor.equals(sprite.pickColor) === false);
    const enablePickColorChanged = (sprite._enablePickColor !== sprite.enablePickColor);
    const uvRectChanged = (sprite._uvRect.equals(sprite.uvRect) === false);

    let idx = 0;

    if (positionChanged || showChanged) {
        idx = index * AttributesItemSize.aPositionAndShow;
        if (positionChanged) {
            sprite._position.copy(sprite.position);
            attributesData.aPositionAndShow[idx] = sprite._position.x;
            attributesData.aPositionAndShow[idx + 1] = sprite._position.y;
            attributesData.aPositionAndShow[idx + 2] = sprite._position.z;
        }
        if (showChanged) {
            sprite._show = sprite.show;
            attributesData.aPositionAndShow[idx + 3] = sprite._show ? 1 : 0;
        }
        markUpdateRange(mesh, 'aPositionAndShow', index, AttributesItemSize.aPositionAndShow);
    }

    if (centerChanged || imageSizeChanged) {
        idx = index * AttributesItemSize.aCenterAndSize;
        if (centerChanged) {
            sprite._center.copy(sprite.center);
            attributesData.aCenterAndSize[idx] = sprite._center.x;
            attributesData.aCenterAndSize[idx + 1] = sprite._center.y;
        }
        if (imageSizeChanged) {
            sprite._imageSize.copy(sprite.imageSize);
            attributesData.aCenterAndSize[idx + 2] = sprite._imageSize.x;
            attributesData.aCenterAndSize[idx + 3] = sprite._imageSize.y;
        }
        markUpdateRange(mesh, 'aCenterAndSize', index, AttributesItemSize.aCenterAndSize);
    }

    if (scaleChanged || rotationChanged || sizeAttenuationChanged) {
        idx = index * AttributesItemSize.aScaleAndRotationAndSizeAttenuation;
        if (scaleChanged) {
            sprite._scale = sprite.scale;
            attributesData.aScaleAndRotationAndSizeAttenuation[idx] = sprite._scale;
        }
        if (rotationChanged) {
            sprite._rotation = sprite.rotation;
            attributesData.aScaleAndRotationAndSizeAttenuation[idx + 1] = sprite._rotation;
        }
        if (sizeAttenuationChanged) {
            sprite._sizeAttenuation = sprite.sizeAttenuation;
            attributesData.aScaleAndRotationAndSizeAttenuation[idx + 2] = sprite._sizeAttenuation ? 1 : 0;
        }
        markUpdateRange(mesh, 'aScaleAndRotationAndSizeAttenuation', index, AttributesItemSize.aScaleAndRotationAndSizeAttenuation);
    }

    if (colorChanged || opacityChanged) {
        idx = index * AttributesItemSize.aColorAndOpacity;
        if (colorChanged) {
            sprite._color.copy(sprite.color);
            attributesData.aColorAndOpacity[idx] = sprite._color.r;
            attributesData.aColorAndOpacity[idx + 1] = sprite._color.g;
            attributesData.aColorAndOpacity[idx + 2] = sprite._color.b;
        }
        if (opacityChanged) {
            sprite._opacity = sprite.opacity;
            attributesData.aColorAndOpacity[idx + 3] = sprite._opacity;
        }
        markUpdateRange(mesh, 'aColorAndOpacity', index, AttributesItemSize.aColorAndOpacity);
    }

    if (pickColorChanged || enablePickColorChanged) {
        idx = index * AttributesItemSize.aPickColorAndEnabled;
        if (pickColorChanged) {
            sprite._pickColor.copy(sprite.pickColor);
            attributesData.aPickColorAndEnabled[idx] = sprite._pickColor.r;
            attributesData.aPickColorAndEnabled[idx + 1] = sprite._pickColor.g;
            attributesData.aPickColorAndEnabled[idx + 2] = sprite._pickColor.b;
        }
        if (enablePickColorChanged) {
            sprite._enablePickColor = sprite.enablePickColor;
            attributesData.aPickColorAndEnabled[idx + 3] = sprite._enablePickColor ? 1 : 0;
        }
        markUpdateRange(mesh, 'aPickColorAndEnabled', index, AttributesItemSize.aPickColorAndEnabled);
    }

    if (uvRectChanged) {
        idx = index * AttributesItemSize.aUvRect;
        sprite._uvRect.copy(sprite.uvRect);
        attributesData.aUvRect[idx] = sprite._uvRect.x;
        attributesData.aUvRect[idx + 1] = sprite._uvRect.y;
        attributesData.aUvRect[idx + 2] = sprite._uvRect.z;
        attributesData.aUvRect[idx + 3] = sprite._uvRect.w;
        markUpdateRange(mesh, 'aUvRect', index, AttributesItemSize.aUvRect);
    }
};
/**
 * 添加一个InstancedSprite实例的数据到InstancedBufferAttribute中对应的位置
 * @param {InstancedSpriteMesh} mesh
 * @param {InstancedSprite} sprite
 * @param {number} index
 * @ignore
*/
function addInstancedSprite(mesh, sprite, index) {
    const attributesData = mesh._attributesData;
    sprite._instanceIndex = index;
    let idx = 0;

    idx = index * AttributesItemSize.aPositionAndShow;
    sprite._position.copy(sprite.position);
    attributesData.aPositionAndShow[idx] = sprite._position.x;
    attributesData.aPositionAndShow[idx + 1] = sprite._position.y;
    attributesData.aPositionAndShow[idx + 2] = sprite._position.z;
    sprite._show = sprite.show;
    attributesData.aPositionAndShow[idx + 3] = sprite._show ? 1 : 0;
    markFullUpdate(mesh, 'aPositionAndShow');

    idx = index * AttributesItemSize.aCenterAndSize;
    sprite._center.copy(sprite.center);
    attributesData.aCenterAndSize[idx] = sprite._center.x;
    attributesData.aCenterAndSize[idx + 1] = sprite._center.y;
    sprite._imageSize.copy(sprite.imageSize);
    attributesData.aCenterAndSize[idx + 2] = sprite._imageSize.x;
    attributesData.aCenterAndSize[idx + 3] = sprite._imageSize.y;
    markFullUpdate(mesh, 'aCenterAndSize');

    idx = index * AttributesItemSize.aScaleAndRotationAndSizeAttenuation;
    sprite._scale = sprite.scale;
    attributesData.aScaleAndRotationAndSizeAttenuation[idx] = sprite._scale;
    sprite._rotation = sprite.rotation;
    attributesData.aScaleAndRotationAndSizeAttenuation[idx + 1] = sprite._rotation;
    sprite._sizeAttenuation = sprite.sizeAttenuation;
    attributesData.aScaleAndRotationAndSizeAttenuation[idx + 2] = sprite._sizeAttenuation ? 1 : 0;
    markFullUpdate(mesh, 'aScaleAndRotationAndSizeAttenuation');

    idx = index * AttributesItemSize.aColorAndOpacity;
    sprite._color.copy(sprite.color);
    attributesData.aColorAndOpacity[idx] = sprite._color.r;
    attributesData.aColorAndOpacity[idx + 1] = sprite._color.g;
    attributesData.aColorAndOpacity[idx + 2] = sprite._color.b;
    sprite._opacity = sprite.opacity;
    attributesData.aColorAndOpacity[idx + 3] = sprite._opacity;
    markFullUpdate(mesh, 'aColorAndOpacity');

    idx = index * AttributesItemSize.aUvRect;
    sprite._uvRect.copy(sprite.uvRect);
    attributesData.aUvRect[idx] = sprite._uvRect.x;
    attributesData.aUvRect[idx + 1] = sprite._uvRect.y;
    attributesData.aUvRect[idx + 2] = sprite._uvRect.z;
    attributesData.aUvRect[idx + 3] = sprite._uvRect.w;
    markFullUpdate(mesh, 'aUvRect');
};

/**
 * InstancedSpriteMesh类，基于InstancedBufferGeometry实现的高性能InstancedSprite渲染组件
 *
 * 一张图集纹理对应一个 InstancedSpriteMesh，所有使用该图集的 Sprite 由其统一绘制
 *
 * @extends {Mesh}
*/
class InstancedSpriteMesh extends Mesh {
    /**
     * @param {InstancedSpriteCollection} collection - 所属的InstancedSpriteCollection实例，必填
     * @param {Texture} texture - 图集纹理，必填
     * @constructor
    */
    constructor(collection, texture) {
        Check.defined('collection', collection);
        Check.defined('texture', texture);
        super(geometry.clone(), collection.useNodeMaterial ? new InstancedSpriteNodeMaterial() : new InstancedSpriteMaterial());
        this._collection = collection; //所属的InstancedSpriteCollection实例
        this.material.texture = texture;
        /**
         * 对象类型标识
         * @type {string}
         * @readonly
        */
        this.type = "InstancedSpriteMesh";
        /**
         * 实例化几何体的包围球基于单位四边形（位于原点），不包含实例位置，视锥剔除会把远离原点的实例整批误剔除，因此禁用
         * @type {boolean}
         * @default false
        */
        this.frustumCulled = false;
        /**
         * @type {Array<InstancedSprite>}
         * @ignore
        */
        this._instancedSprites = [];
        /**
         * @type {Array<InstancedSprite>}
         * @ignore
        */
        this._addInstancedSprites = [];
        /**
         * @type {Array<InstancedSprite>}
         * @ignore
        */
        this._removeInstancedSprites = [];
        /**
         * InstancedBufferAttribute数据存储对象，key为属性名称，value为对应的Float32Array数组
         * @type {Object<string, Float32Array>}
         * @ignore
        */
        this._attributesData = {};
        /**
         * 当前能容纳的最大InstancedSprite数量，初始为0，InstancedSpriteMesh会根据需要动态扩容
         * @type {number}
         * @ignore
        */
        this._maxCapacity = 0;
        this._ensureCapacity(1024);
        // 初始无实例，绘制数量为0（_ensureCapacity 只负责扩容，不改变实例数量）
        this.geometry.instanceCount = 0;
    }
    /**
     * InstancedSpriteMesh对象标识
     * @type {boolean}
     * @readonly
    */
    get isInstancedSpriteMesh() { return true; }
    /**
     * 深度测试开关，默认为true，开启后会进行深度测试以正确处理遮挡关系，但可能会有性能影响；如果关闭则所有InstancedSprite都会被渲染在最前面，适合需要始终显示的UI元素等场景
     * @type {boolean}
     * @default true
    */
    get depthTest() { return this.material.depthTest; }
    set depthTest(value) {
        Check.typeOf.boolean('depthTest', value);
        this.material.depthTest = value;
    }
    /**
     * 深度写入开关，默认为true；多个半透明 Sprite 重叠时，开启深度写入可能导致排序瑕疵（后方 Sprite 被错误遮挡），关闭可缓解，适合半透明标签/粒子等场景
     * @type {boolean}
     * @default true
    */
    get depthWrite() { return this.material.depthWrite; }
    set depthWrite(value) {
        Check.typeOf.boolean('depthWrite', value);
        this.material.depthWrite = value;
    }
    /**
     * InstancedSprite对象数组
     * @type {Array<InstancedSprite>}
     * @readonly
    */
    get instancedSprites() { return this._instancedSprites; }
    /**
     * 确保InstancedBufferAttribute的大小能够容纳指定数量的InstancedSprite实例，如果当前最大容量不足，则进行扩容
     * @param {number} required - 需要容纳的InstancedSprite数量
     * @private
    */
    _ensureCapacity(required) {
        if (required <= this._maxCapacity) return;

        // 线性扩容（+1024）保证内存浪费有界；Three.js 不支持原地扩容 buffer，需新建数组与 attribute
        const newCapacity = Math.max(required, this._maxCapacity + 1024);

        for (const [name, itemSize] of Object.entries(AttributesItemSize)) {
            const oldArray = this._attributesData[name];
            const newArray = new Float32Array(newCapacity * itemSize);
            if (oldArray) {
                newArray.set(oldArray.subarray(0, Math.min(oldArray.length, newArray.length)));
            }
            this._attributesData[name] = newArray;

            const attribute = new InstancedBufferAttribute(newArray, itemSize);
            this.geometry.setAttribute(name, attribute);
        }

        this._maxCapacity = newCapacity;
    }
    /**
     * 预分配容量，避免后续动态扩容（不改变当前实际绘制的实例数量）
     * @param {number} capacity - 需要预留的实例数量
     * @returns {InstancedSpriteMesh}
    */
    reserve(capacity) {
        Check.typeOf.number('capacity', capacity);
        this._ensureCapacity(capacity);
        return this;
    }
    /**
     * 添加一个InstancedSprite
     * @param {InstancedSprite} sprite - 要添加的InstancedSprite实例
     * @returns {InstancedSpriteMesh}
    */
    add(sprite) {
        sprite._mesh = this;
        this._addInstancedSprites.push(sprite);
        return this;
    }
    /**
     * 移除一个InstancedSprite
     * @param {InstancedSprite} sprite - 要移除的InstancedSprite实例
     * @returns {InstancedSpriteMesh}
    */
    remove(sprite) {
        if (this._instancedSprites.includes(sprite) && !this._removeInstancedSprites.includes(sprite))
            this._removeInstancedSprites.push(sprite);
        else
            console.warn('InstancedSprite not found in InstancedSpriteMesh or already marked for removal');
        return this;
    }
    /**
     * 移除所有InstancedSprite
     * @returns {InstancedSpriteMesh}
    */
    clear() {
        this._addInstancedSprites.length = 0;
        this._removeInstancedSprites.length = 0;
        this._instancedSprites.length = 0;
        this.geometry.instanceCount = 0;
        return this;
    }
    /**
     * Computes intersection points between a casted ray and this sprite.
     *
     * @param {Raycaster} raycaster - The raycaster.
     * @param {Array<Object>} intersects - The target array that holds the intersection points.
     */
    raycast(raycaster, intersects) {

        if (raycaster.camera === null) {

            console.error('InstancedSpriteMesh: "Raycaster.camera" needs to be set in order to raycast against sprites.');
            return;

        }

        const sprites = this._instancedSprites;
        for (const sprite of sprites) {
            sprite.raycast(raycaster, intersects, raycaster.camera.matrixWorldInverse);
        }
    }
    /**
     * 每帧更新
     * @private
    */
    update() {
        if (!this.visible) return;

        const removeInstancedSprites = this._removeInstancedSprites;
        const addInstancedSprites = this._addInstancedSprites;
        const instancedSprites = this._instancedSprites;

        // 计算最终需要的容量
        const requiredCapacity = instancedSprites.length + addInstancedSprites.length - removeInstancedSprites.length;
        this._ensureCapacity(requiredCapacity);

        if (removeInstancedSprites.length > 0) {
            // 末位换入（swap-and-pop）移除：把最后一个 sprite 换到被移除的位置，O(k) 而非 O(n) 全量重写
            const movedSprites = [];
            for (const sprite of removeInstancedSprites) {
                const index = sprite._instanceIndex;
                if (index === -1)
                    continue; // 已被处理过（例如换入后又在本帧被移除）

                const last = instancedSprites[instancedSprites.length - 1];
                instancedSprites.pop();
                if (last !== sprite) {
                    instancedSprites[index] = last;
                    last._instanceIndex = index; // 立即更新，避免后续删除用到陈旧索引
                    movedSprites.push(last);
                }
                sprite._instanceIndex = -1;
                sprite._mesh = undefined;
            }
            removeInstancedSprites.length = 0;

            // 重写被移动 sprite 的数据到新位置
            for (const sprite of movedSprites) {
                if (sprite._instanceIndex !== -1) {
                    addInstancedSprite(this, sprite, sprite._instanceIndex);
                }
            }

            // 添加新 sprite
            while (addInstancedSprites.length > 0) {
                const sprite = addInstancedSprites.shift();
                addInstancedSprite(this, sprite, instancedSprites.length);
                instancedSprites.push(sprite);
            }
        } else {
            // 检查并更新属性值有变化的InstancedSprite
            for (const sprite of instancedSprites) {
                checkAndUpdateInstancedSprite(this, sprite);
            }

            // 添加InstancedSprite
            while (addInstancedSprites.length > 0) {
                const sprite = addInstancedSprites.shift();
                addInstancedSprite(this, sprite, instancedSprites.length);
                instancedSprites.push(sprite);
            }
        }

        this.geometry.instanceCount = instancedSprites.length; //更新instanceCount
    }
    /**
     * 释放 GPU 资源
    */
    dispose() {
        this.clear();
        this.geometry.dispose();
        this.material.dispose();
    }
};

export default InstancedSpriteMesh;
export { InstancedSpriteMesh };
