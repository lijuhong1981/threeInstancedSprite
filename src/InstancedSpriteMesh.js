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
});
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
        mesh.geometry.attributes.aPositionAndShow.needsUpdate = true;
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
        mesh.geometry.attributes.aCenterAndSize.needsUpdate = true;
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
        mesh.geometry.attributes.aScaleAndRotationAndSizeAttenuation.needsUpdate = true;
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
        mesh.geometry.attributes.aColorAndOpacity.needsUpdate = true;
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
    mesh.geometry.attributes.aPositionAndShow.needsUpdate = true;

    idx = index * AttributesItemSize.aCenterAndSize;
    sprite._center.copy(sprite.center);
    attributesData.aCenterAndSize[idx] = sprite._center.x;
    attributesData.aCenterAndSize[idx + 1] = sprite._center.y;
    sprite._imageSize.copy(sprite.imageSize);
    attributesData.aCenterAndSize[idx + 2] = sprite._imageSize.x;
    attributesData.aCenterAndSize[idx + 3] = sprite._imageSize.y;
    mesh.geometry.attributes.aCenterAndSize.needsUpdate = true;

    idx = index * AttributesItemSize.aScaleAndRotationAndSizeAttenuation;
    sprite._scale = sprite.scale;
    attributesData.aScaleAndRotationAndSizeAttenuation[idx] = sprite._scale;
    sprite._rotation = sprite.rotation;
    attributesData.aScaleAndRotationAndSizeAttenuation[idx + 1] = sprite._rotation;
    sprite._sizeAttenuation = sprite.sizeAttenuation;
    attributesData.aScaleAndRotationAndSizeAttenuation[idx + 2] = sprite._sizeAttenuation ? 1 : 0;
    mesh.geometry.attributes.aScaleAndRotationAndSizeAttenuation.needsUpdate = true;

    idx = index * AttributesItemSize.aColorAndOpacity;
    sprite._color.copy(sprite.color);
    attributesData.aColorAndOpacity[idx] = sprite._color.r;
    attributesData.aColorAndOpacity[idx + 1] = sprite._color.g;
    attributesData.aColorAndOpacity[idx + 2] = sprite._color.b;
    sprite._opacity = sprite.opacity;
    attributesData.aColorAndOpacity[idx + 3] = sprite._opacity;
    mesh.geometry.attributes.aColorAndOpacity.needsUpdate = true;
};

/**
 * InstancedSpriteMesh类，基于InstancedBufferGeometry实现的高性能InstancedSprite渲染组件
 * 
 * @extends {Mesh}
*/
class InstancedSpriteMesh extends Mesh {
    /**
     * @param {InstancedSpriteCollection} collection - 所属的InstancedSpriteCollection实例，必填
     * @param {Texture} texture - 材质图像纹理，必填
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
        this._enaureCapacity(64);
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
    _enaureCapacity(required) {
        if (required < this._maxCapacity) return;

        const newCapacity = Math.max(required, this._maxCapacity + 64);

        for (const [name, itemSize] of Object.entries(AttributesItemSize)) {
            const newArray = new Float32Array(newCapacity * itemSize);
            const oldArray = this._attributesData[name];
            if (oldArray) {
                const copyLen = Math.min(oldArray.length, newArray.length);
                newArray.set(oldArray.subarray(0, copyLen));
            }
            this._attributesData[name] = newArray;
        }

        // 创建 InstancedBufferAttribute 对象
        for (const [name, itemSize] of Object.entries(AttributesItemSize)) {
            const attr = new InstancedBufferAttribute(this._attributesData[name], itemSize);
            this.geometry.setAttribute(name, attr);
        }

        this.geometry.instanceCount = required;
        this._maxCapacity = newCapacity;
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
        this._enaureCapacity(requiredCapacity);

        if (removeInstancedSprites.length > 0) {
            // 如果有需要移除的InstancedSprite，先从instancedSprites数组中移除
            for (const sprite of removeInstancedSprites) {
                const index = instancedSprites.indexOf(sprite);
                if (index !== -1) {
                    instancedSprites.splice(index, 1); //从instancedSprites数组中移除
                    sprite._mesh = undefined;
                    sprite._instanceIndex = -1;
                }
                // else
                //     console.warn('InstancedSprite not found in InstancedSpriteMesh during removal');
            }
            removeInstancedSprites.length = 0;

            // 如果有需要添加的InstancedSprite，则加入instancedSprites数组中
            if (addInstancedSprites.length > 0) {
                instancedSprites.push(...addInstancedSprites);
                addInstancedSprites.length = 0;
            }

            // 重新写入所有InstancedSprite的属性数据到InstancedBufferAttribute中
            const length = instancedSprites.length;
            for (let i = 0; i < length; i++) {
                const sprite = instancedSprites[i];
                addInstancedSprite(this, sprite, i);
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
    dispose() {
        this.clear();
        this.geometry.dispose();
        this.material.dispose();
    }
};

export default InstancedSpriteMesh;
export { InstancedSpriteMesh };

