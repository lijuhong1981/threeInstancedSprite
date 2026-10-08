import Check from "@lijuhong1981/jscheck/src/Check.js";
import {
    MathUtils,
    Object3D,
} from "three";
import InstancedSprite from "./InstancedSprite.js";
import InstancedSpriteMesh from "./InstancedSpriteMesh.js";
import TextureAtlas from "./TextureAtlas.js";

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
 * * 使用纹理图集将不同图片打包，一张图集对应一个 InstancedSpriteMesh（一次 draw call）
 * * 图集扩容到上限后会新建图集与 Mesh
 * @extends Object3D
 */
class InstancedSpriteCollection extends Object3D {
    /**
     * @param {boolean} [useNodeMaterial=false] - 是否使用TSL的NodeMaterial（WebGPU），默认false
     * @param {object} [options] - 图集配置项
     * @param {number} [options.initialSize=1024] - 图集初始边长
     * @param {number} [options.maxSize=8192] - 图集最大边长
     * @param {number} [options.padding=2] - 子图间距
     * @constructor
    */
    constructor(useNodeMaterial = false, options = {}) {
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
        /**
         * @type {Array<InstancedSprite>}
         * @ignore
        */
        this._instancedSprites = [];
        /**
         * @type {Map<string, InstancedSprite>}
         * @ignore
        */
        this._spriteByUuid = new Map();
        /**
         * 图集与对应 Mesh 的列表，按创建顺序排列
         * @type {Array<{atlas:TextureAtlas, mesh:InstancedSpriteMesh}>}
         * @ignore
        */
        this._atlasList = [];
        /**
         * 图集配置项，新建图集时使用
         * @type {object}
         * @ignore
        */
        this._atlasOptions = options;
        this._depthTest = true;
        this._depthWrite = true;
        /**
         * 预留容量，在创建新Mesh时应用，undefined表示不预留
         * @type {number|undefined}
         * @ignore
        */
        this._reservedCapacity = undefined;
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
        Check.typeOf.boolean('depthTest', value);
        this._depthTest = value;
        for (const entry of this._atlasList) {
            entry.mesh.depthTest = value;
        }
    }
    /**
     * 深度写入开关，默认为true；多个半透明 Sprite 重叠时，开启深度写入可能导致排序瑕疵（后方 Sprite 被错误遮挡），关闭可缓解，适合半透明标签/粒子等场景
     * @type {boolean}
     * @default true
    */
    get depthWrite() { return this._depthWrite; }
    set depthWrite(value) {
        Check.typeOf.boolean('depthWrite', value);
        this._depthWrite = value;
        for (const entry of this._atlasList) {
            entry.mesh.depthWrite = value;
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
            this._setImageAtlas(source, sprite);
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
     * 将图片打包进图集并加入对应 Mesh
     * @param {HTMLImageElement|HTMLCanvasElement} source
     * @param {InstancedSprite} sprite
     * @private
    */
    _setImageAtlas(source, sprite) {
        sprite._image = source;
        const loaded = source instanceof HTMLCanvasElement || (source.width > 0 && source.height > 0);
        if (loaded) {
            this._assignAtlas(source, sprite);
        } else {
            const onload = () => {
                source.removeEventListener('load', onload);
                // 图片加载完成前 sprite 可能已被移除，此时不再加入图集
                if (this._spriteByUuid.get(sprite.uuid) === sprite)
                    this._assignAtlas(source, sprite);
            };
            source.addEventListener('load', onload);
        }
    }
    /**
     * 将已加载的图片打包进图集，设置 sprite 的 uvRect 与 imageSize，并加入图集 Mesh
     * @param {HTMLImageElement|HTMLCanvasElement} source
     * @param {InstancedSprite} sprite
     * @private
    */
    _assignAtlas(source, sprite) {
        let entry = this._atlasList[this._atlasList.length - 1];
        let rect = entry ? entry.atlas.add(source) : null;
        if (rect === null && entry) {
            // 图集已满，尝试扩容
            if (entry.atlas.grow()) {
                this._recomputeUvRects(entry);
                rect = entry.atlas.add(source);
            }
        }
        if (rect === null) {
            // 图集已达最大尺寸，新建图集与 Mesh
            entry = this._createAtlasEntry();
            this._atlasList.push(entry);
            rect = entry.atlas.add(source);
        }
        const uv = entry.atlas.getUvRect(rect);
        sprite.uvRect.set(uv[0], uv[1], uv[2], uv[3]);
        sprite.imageSize.set(source.width, source.height);
        sprite._remove();
        entry.mesh.add(sprite);
    }
    /**
     * 图集扩容后重新归一化该图集内所有 sprite 的 uvRect
     * @param {{atlas:TextureAtlas, mesh:InstancedSpriteMesh}} entry
     * @private
    */
    _recomputeUvRects(entry) {
        for (const sprite of this._instancedSprites) {
            if (sprite._mesh === entry.mesh) {
                const rect = entry.atlas.getRect(sprite._image);
                if (rect) {
                    const uv = entry.atlas.getUvRect(rect);
                    sprite.uvRect.set(uv[0], uv[1], uv[2], uv[3]);
                }
            }
        }
    }
    /**
     * 创建新的图集与对应 Mesh
     * @returns {{atlas:TextureAtlas, mesh:InstancedSpriteMesh}}
     * @private
    */
    _createAtlasEntry() {
        const atlas = new TextureAtlas(this._atlasOptions);
        const mesh = new InstancedSpriteMesh(this, atlas.texture);
        mesh.depthTest = this._depthTest;
        mesh.depthWrite = this._depthWrite;
        if (this._reservedCapacity !== undefined) {
            mesh.reserve(this._reservedCapacity);
        }
        super.add(mesh);
        return { atlas, mesh };
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
        return this._spriteByUuid.get(uuid);
    }
    /**
     * 添加InstancedSprite
     * @param {InstancedSpriteOptions} options - 初始化配置项
     * @returns {InstancedSprite}
    */
    add(options = {}) {
        const sprite = new InstancedSprite(options, this);
        this._instancedSprites.push(sprite);
        this._spriteByUuid.set(sprite.uuid, sprite);
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
            this._spriteByUuid.delete(sprite.uuid);
            sprite._remove();
        }
        return this;
    }
    /**
     * 移除所有InstancedSprite，并清空所有Mesh的实例数据（Mesh与图集保留以便复用）
     * @returns {InstancedSpriteCollection}
    */
    clear() {
        for (const sprite of this._instancedSprites) {
            sprite._mesh = undefined;
            sprite._instanceIndex = -1;
        }
        this._instancedSprites.length = 0;
        this._spriteByUuid.clear();
        for (const entry of this._atlasList) {
            entry.mesh.clear();
        }
        return this;
    }
    /**
     * 预分配所有Mesh的容量，避免后续动态扩容
     * @param {number} capacity - 需要预留的实例数量
     * @returns {InstancedSpriteCollection}
    */
    reserve(capacity) {
        Check.typeOf.number('capacity', capacity);
        this._reservedCapacity = capacity;
        for (const entry of this._atlasList) {
            entry.mesh.reserve(capacity);
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
        for (const entry of this._atlasList) {
            entry.mesh.raycast(raycaster, intersects);
        }
    }
    /**
     * 每帧更新
     * @private
    */
    update() {
        if (!this.visible) return;

        for (const entry of this._atlasList) {
            entry.mesh.update();
        }
    }
};

export default InstancedSpriteCollection;
export { InstancedSpriteCollection };
