import Check from "@lijuhong1981/jscheck/src/Check.js";
import ImageLoader from "@lijuhong1981/jsload/src/ImageLoader.js";
import { Loader } from "@lijuhong1981/jsload/src/Loader.js";
import setValues from "@lijuhong1981/three.utils/src/setValues.js";
import { Color, MathUtils, Vector2, Vector3 } from "three";

/**
 * @import InstancedSpriteCollection from "./InstancedSpriteCollection.js";
 * @import InstancedSpriteMesh from "./InstancedSpriteMesh.js";
 */

const scratchVector2 = new Vector2();
const scratchVector3 = new Vector3();
const imageLoader = new ImageLoader({ cacheType: Loader.CacheType.ALONE, });

/**
 * InstancedSprite 对象配置项选项
 * @typedef {object} InstancedSpriteOptions
 * @property {boolean} [show=true] 是否显示
 * @property {Vector3|Array<number>} [position=(0,0,0)] 位置（世界空间）
 * @property {number} [scale=1] 缩放
 * @property {number} [rotation=0] 旋转（弧度）
 * @property {boolean} [sizeAttenuation=false] 尺寸是否跟随相机深度变化
 * @property {Vector2|Array<number>} [center=(0.5,0.5)] 锚点中心（0-1）
 * @property {Color|number|string} [color=0xffffff] 颜色
 * @property {number} [opacity=1] 不透明度（0-1）
 * @property {string|HTMLImageElement|HTMLCanvasElement} [image] 图片资源
 */

/**
 * InstancedSprite 数据模型类，用于存储单个 InstancedSprite 的所有属性
 *
 * * InstancedSprite跟Sprite不同，它只是一个数据集合对象，并不继承自Object3D，不能直接加入到Scene中
 * * 但它可以作为属性Module使用，修改InstancedSprite的属性会自动更新至GPU中
 */
class InstancedSprite {
    /**
     * @param {InstancedSpriteOptions} options - 初始化配置项
     * @param {InstancedSpriteCollection} collection - 所属InstancedSpriteCollection实例，必填
     * @constructor
     */
    constructor(options = {}, collection) {
        Check.defined('collection', collection);
        /**
         * 所属集合，内部设置
         * @type {InstancedSpriteCollection}
         * @ignore
        */
        this._collection = collection;
        /**
         * 所属Mesh，内部设置
         * @type {InstancedSpriteMesh}
         * @ignore
        */
        this._mesh = undefined;
        /**
         * 在 InstancedSpriteMesh 中的实例索引，由 InstancedSpriteMesh 内部设置
         * @type {number}
         * @ignore
        */
        this._instanceIndex = -1;
        /**
         * 对象类型标识
         * @type {string}
         * @readonly
        */
        this.type = "InstancedSprite";
        /**
         * 当前InstancedSprite的唯一标识id
         * @type {string}
         * @readonly
        */
        this.uuid = MathUtils.generateUUID();
        /**
         * 是否显示 
         * @type {boolean}
         */
        this.show = true;
        this._show = true;
        /** 
         * 世界坐标位置
         * @type {Vector3} 
         */
        this.position = new Vector3(0, 0, 0);
        this._position = new Vector3(0, 0, 0);
        /**
         * 缩放
         * @type {number}
        */
        this.scale = 1;
        this._scale = 1;
        /**
         * 旋转（弧度）
         * @type {number}
        */
        this.rotation = 0;
        this._rotation = 0;
        /**
         * 尺寸是否跟随相机深度变化
         * @type {boolean}
        */
        this.sizeAttenuation = false;
        this._sizeAttenuation = false;
        /**
         * 锚点中心（0-1）
         * @type {Vector2}
        */
        this.center = new Vector2(0.5, 0.5);
        this._center = new Vector2(0.5, 0.5);
        /**
         * 颜色
         * @type {Color}
        */
        this.color = new Color(0xffffff);
        this._color = new Color(0xffffff);
        /**
         * 不透明度（0-1）
         * @type {number}
        */
        this.opacity = 1;
        this._opacity = 1;
        /**
         * 图片尺寸（像素），图片加载完成后可用
         * @type {Vector2}
         * @readonly
        */
        this.imageSize = new Vector2(0, 0);
        this._imageSize = new Vector2(0, 0);
        this._image = null;

        this.setValues(options);
    }
    /** 
     * InstancedSprite对象标识
     * @type {boolean} 
     * @readonly
     */
    get isInstancedSprite() { return true; }
    /**
     * 设置参数
     * @param {InstancedSpriteOptions} options
     * @returns {InstancedSprite}
    */
    setValues(options) {
        setValues(this, options);
        return this;
    }
    /**
     * 是否可见，等同于show 
     * @type {boolean}
     */
    get visible() {
        return this.show;
    }
    set visible(value) { this.show = value; }
    /**
     * 旋转（角度）
     * @type {number}
    */
    get rotationDegrees() { return MathUtils.radToDeg(this.rotation); }
    set rotationDegrees(value) { this.rotation = MathUtils.degToRad(value); }
    /** 
     * 图片资源，可以是URL字符串、HTMLImageElement或HTMLCanvasElement
     * @type {string|HTMLImageElement|HTMLCanvasElement}
    */
    get image() { return this._image; }
    set image(value) {
        if (this._image) {
            if (typeof value === 'string') {
                if (this._image.src === value)
                    return;
            } else if (value instanceof HTMLImageElement || value instanceof HTMLCanvasElement) {
                if (this._image === value)
                    return;
            }
        }
        this._collection._setImage(value, this);
    }
    /**
     * 图片ID，图片加载完成后可用，通常为图片URL或生成的UUID
     * @type {string}
     * @readonly
    */
    get imageId() { return this._image && this._image.src; }
    /**
     * 图片像素宽度，图片加载完成后可用
     * @type {number}
     * @readonly
    */
    get imageWidth() { return this.imageSize.x; }
    /**
     * 图片像素高度，图片加载完成后可用
     * @type {number}
     * @readonly
    */
    get imageHeight() { return this.imageSize.y; }
    _remove() {
        this._mesh && this._mesh.remove(this);
        return this;
    }
    /**
     * 从Mesh中移除该InstancedSprite对象
     * @return {InstancedSprite}
    */
    remove() {
        this._collection && this._collection.remove(this);
        return this;
    }
};

export default InstancedSprite;
export { InstancedSprite };
