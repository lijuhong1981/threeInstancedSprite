import Check from "@lijuhong1981/jscheck/src/Check.js";
import {
    MathUtils,
    Object3D,
    Texture
} from "three";
import InstancedSprite from "./InstancedSprite.js";
import InstancedSpriteMesh from "./InstancedSpriteMesh.js";

/**
 * @import InstancedSpriteOptions from "./InstancedSprite.js";
*/

/**
 * @type {Map<string, HTMLImageElement|HTMLCanvasElement>}
 * @ignore
*/
const imageCache = new Map();

/**
 * InstancedSpriteCollection类，批量管理InstancedSprite实例
 * 
 * * 继承自Object3D
 * * 根据InstancedSprite的图像属性生成InstancedSpriteMaterial和InstancedSpriteMesh，
 * * 管理InstancedSprite与InstancedSpriteMesh实例
 * @extends Object3D
 */
class InstancedSpriteCollection extends Object3D {
    /**
     * @param {boolean} [useNodeMaterial=false] - 是否使用TSL的NodeMaterial，默认false
     * @constructor
    */
    constructor(useNodeMaterial = false) {
        super();
        /**
         * 是否使用TSL的NodeMaterial，默认false
         * @type {boolean}
         * @readonly
         * @default false
        */
        this.useNodeMaterial = useNodeMaterial;
        /**
         * 对象类型标识
         * @type {string}
         * @readonly
        */
        this.type = "InstancedSpriteCollection";
        // this.frustumCulled = false;
        /**
         * @type {Array<InstancedSprite>}
         * @ignore
        */
        this._instancedSprites = [];
        /**
         * @type {Map<HTMLImageElement|HTMLCanvasElement, InstancedSpriteMesh>}
         * @ignore
        */
        this._meshes = new Map();
        this._depthTest = true;
    }
    /**
     * InstancedSpriteCollection对象标识
     * @type {boolean}
     * @readonly
    */
    get isInstancedSpriteCollection() { return true; }
    /**
     * 深度测试开关，默认为true，开启后会进行深度测试以正确处理遮挡关系，但可能会有性能影响；如果关闭则所有InstancedSprite都会被渲染在最前面，适合需要始终显示的UI元素等场景
     * @type {boolean}
     * @default true
    */
    get depthTest() { return this._depthTest; }
    set depthTest(value) {
        Check.typeOf.boolean(value, 'depthTest');
        this._depthTest = value;
        const meshes = this._meshes.values();
        for (const mesh of meshes) {
            mesh.depthTest = value;
        }
    }
    /**
     * @param {string|HTMLImageElement|HTMLCanvasElement} source
     * @param {InstancedSprite} sprite
    */
    _setImage(source, sprite) {
        if (source instanceof HTMLImageElement || source instanceof HTMLCanvasElement) {
            if (!source.src)
                source.src = MathUtils.generateUUID();
            if (!imageCache.has(source.src))
                imageCache.set(source.src, source);
            let mesh = this._meshes.get(source);
            if (!mesh) {
                const texture = new Texture();
                if (source instanceof HTMLCanvasElement || (source instanceof HTMLImageElement && source.complete)) {
                    texture.image = source;
                    texture.needsUpdate = true;
                } else {
                    const onload = () => {
                        source.removeEventListener('load', onload);
                        texture.image = source;
                        texture.needsUpdate = true;
                        sprite.imageSize.set(source.width, source.height);
                    };
                    source.addEventListener('load', onload);
                }
                mesh = new InstancedSpriteMesh(this, texture);
                mesh.depthTest = this._depthTest;
                this._meshes.set(source, mesh);
                super.add(mesh);
            }
            if (sprite._mesh === mesh)
                return;
            // instancedSprite如果已经有所属的mesh了，则从所属的Mesh中移除
            sprite.remove();
            mesh.add(sprite);
            sprite._image = source;
            if (source.width !== 0 && source.height !== 0) {
                sprite.imageSize.set(source.width, source.height);
            }
        } else if (typeof source === 'string') {
            let image = imageCache.get(source);
            if (!image) {
                image = new Image();
                image.src = source;
                imageCache.set(source, image);
            }
            this._setImage(image, sprite);
        } else {
            throw new Error('Invalid image source type ' + source);
        }
    }
    /**
     * InstancedSprite实例数组
     * @type {Array<InstancedSprite>}
     * @readonly
    */
    get instancedSprites() {
        return this._instancedSprites;
    }
    /**
     * InstancedSprite实例数量
     * @type {number}
     * @readonly
    */
    get size() {
        return this._instancedSprites.length;
    }
    /**
     * 根据索引获取InstancedSprite实例
     * @param {number} index 
     * @returns {InstancedSprite|undefined}
    */
    get(index) {
        return this._instancedSprites[index];
    }
    /**
     * 根据uuid获取InstancedSprite实例
     * @param {string} uuid
     * @returns {InstancedSprite|undefined}
    */
    getByUuid(uuid) {
        for (const sprite of this._instancedSprites) {
            if (sprite.uuid === uuid)
                return sprite;
        }
    }
    /**
     * 添加InstancedSprite
     * @type {InstancedSpriteConstructorOptions} options
     * @returns {InstancedSprite}
    */
    add(options = {}) {
        const sprite = new InstancedSprite(options, this);
        this._instancedSprites.push(sprite);
        return sprite;
    }
    /**
     * 移除InstancedSprite
     * @param {InstancedSprite} sprite
     * @returns {InstancedSpriteCollection}
    */
    remove(sprite) {
        const index = this._instancedSprites.indexOf(sprite);
        if (index !== -1) {
            this._instancedSprites.splice(index, 1);
            sprite._remove();
        }
        return this;
    }
    /**
     * 遍历所有的InstancedSprite
     * @param {Function} callback
     * @returns {InstancedSpriteCollection}
    */
    forEach(callback) {
        this._instancedSprites.forEach(callback);
        return this;
    }
    /**
     * Computes intersection points between a casted ray and this sprite.
     *
     * @param {Raycaster} raycaster - The raycaster.
     * @param {Array<Object>} intersects - The target array that holds the intersection points.
     */
    raycast(raycaster, intersects) {
        const meshes = this._meshes.values();
        for (const mesh of meshes) {
            mesh.raycast(raycaster, intersects);
        }
    }
    /**
     * 每帧更新
     * @private
     */
    update() {
        if (!this.visible) return;

        const meshes = this._meshes.values();
        for (const mesh of meshes) {
            mesh.update();
        }
    }
};

export default InstancedSpriteCollection;
export { InstancedSpriteCollection };