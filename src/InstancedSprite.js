import Check from "@lijuhong1981/jscheck/src/Check.js";
import ImageLoader from "@lijuhong1981/jsload/src/ImageLoader.js";
import { Loader } from "@lijuhong1981/jsload/src/Loader.js";
import setValues from "@lijuhong1981/three.utils/src/setValues.js";
import { Color, InstancedBufferGeometry, MathUtils, Matrix4, Triangle, Vector2, Vector3 } from "three";

/**
 * @import InstancedSpriteCollection from "./InstancedSpriteCollection.js";
 * @import InstancedSpriteMesh from "./InstancedSpriteMesh.js";
 * @import InstancedSpriteMaterial from "./InstancedSpriteMaterial.js";
 * @import InstancedSpriteNodeMaterial from "./InstancedSpriteNodeMaterial.js";
 */

const imageLoader = new ImageLoader({ cacheType: Loader.CacheType.ALONE, });

const _intersectPoint = /*@__PURE__*/ new Vector3();
const _worldScale = /*@__PURE__*/ new Vector3();
const _mvPosition = /*@__PURE__*/ new Vector3();

const _alignedPosition = /*@__PURE__*/ new Vector2();
const _rotatedPosition = /*@__PURE__*/ new Vector2();
const _viewWorldMatrix = /*@__PURE__*/ new Matrix4();

const _vA = /*@__PURE__*/ new Vector3();
const _vB = /*@__PURE__*/ new Vector3();
const _vC = /*@__PURE__*/ new Vector3();

const _uvA = /*@__PURE__*/ new Vector2();
const _uvB = /*@__PURE__*/ new Vector2();
const _uvC = /*@__PURE__*/ new Vector2();

function transformVertex(vertexPosition, mvPosition, center, scale, sin, cos) {

    // compute position in camera space
    _alignedPosition.subVectors(vertexPosition, center).addScalar(0.5).multiply(scale);

    // to check if rotation is not zero
    if (sin !== undefined) {

        _rotatedPosition.x = (cos * _alignedPosition.x) - (sin * _alignedPosition.y);
        _rotatedPosition.y = (sin * _alignedPosition.x) + (cos * _alignedPosition.y);

    } else {

        _rotatedPosition.copy(_alignedPosition);

    }


    vertexPosition.copy(mvPosition);
    vertexPosition.x += _rotatedPosition.x;
    vertexPosition.y += _rotatedPosition.y;

    // transform to world space
    vertexPosition.applyMatrix4(_viewWorldMatrix);

}

/**
 * InstancedSprite 对象配置项选项
 * @typedef {object} InstancedSpriteOptions
 * @property {boolean} [show=true] 是否显示
 * @property {Vector3|Array<number>} [position=(0,0,0)] 位置（世界空间）
 * @property {number} [scale=1] 缩放
 * @property {number} [rotation=0] 旋转（弧度）
 * @property {boolean} [sizeAttenuation=true] 尺寸是否跟随相机深度变化
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
        this.sizeAttenuation = true;
        this._sizeAttenuation = true;
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
        /**
         * 拾取颜色，用于GPU拾取，由Picking管理器设置和使用，用户无需关心
         * @type {Color}
         * @readonly
         * @private
        */
        this.pickColor = new Color();
        this._pickColor = new Color();
        /**
         * 是否启用拾取颜色，用于GPU拾取，由Picking管理器设置和使用，用户无需关心
         * @type {boolean}
         * @readonly
         * @private
        */
        this.enablePickColor = false;
        this._enablePickColor = false;
        /**
         * 用户自定义数据存储对象，InstancedSprite本身不使用该属性，用户可以自由使用它来存储任意数据
         * @type {object}
         * @readonly
        */
        this.userData = {};

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
     * InstancedSprite对象的几何体属性
     * @type {InstancedBufferGeometry}
     * @readonly
    */
    get geometry() {
        return this._mesh ? this._mesh.geometry : undefined;
    }
    /**
     * InstancedSprite对象的材质属性，可能是InstancedSpriteMaterial或InstancedSpriteNodeMaterial
     * @type {InstancedSpriteMaterial|InstancedSpriteNodeMaterial}
     * @readonly
    */
    get material() {
        return this._mesh ? this._mesh.material : undefined;
    }
    /**
     * 从Mesh中移除该InstancedSprite对象
     * @return {InstancedSprite}
    */
    remove() {
        this._collection && this._collection.remove(this);
        return this;
    }
    /**
     * Computes intersection points between a casted ray and this sprite.
     *
     * @param {Raycaster} raycaster - The raycaster.
     * @param {Array<Object>} intersects - The target array that holds the intersection points.
     * @param {Matrix4} modelViewMatrix
     */
    raycast(raycaster, intersects, modelViewMatrix) {

        if (this.show === false || this.imageSize.x <= 0 || this.imageSize.y <= 0) {
            return;
        }

        _viewWorldMatrix.copy(raycaster.camera.matrixWorld);
        _mvPosition.copy(this.position).applyMatrix4(modelViewMatrix);

        const depth = -_mvPosition.z;
        if (depth <= 0) {
            return;
        }

        let scale = this.scale;
        if (raycaster.camera.isPerspectiveCamera && this.sizeAttenuation === false) {
            scale *= depth;
        }
        const aspectRatio = this.imageSize.x / this.imageSize.y;
        _worldScale.set(1, 1, 1).multiplyScalar(scale * aspectRatio);

        const rotation = this.rotation;
        let sin, cos;

        if (rotation !== 0) {
            cos = Math.cos(rotation);
            sin = Math.sin(rotation);
        }

        const center = this.center;

        transformVertex(_vA.set(-0.5, -0.5, 0), _mvPosition, center, _worldScale, sin, cos);
        transformVertex(_vB.set(0.5, -0.5, 0), _mvPosition, center, _worldScale, sin, cos);
        transformVertex(_vC.set(0.5, 0.5, 0), _mvPosition, center, _worldScale, sin, cos);

        _uvA.set(0, 0);
        _uvB.set(1, 0);
        _uvC.set(1, 1);

        // check first triangle
        let intersect = raycaster.ray.intersectTriangle(_vA, _vB, _vC, false, _intersectPoint);

        if (intersect === null) {

            // check second triangle
            transformVertex(_vB.set(-0.5, 0.5, 0), _mvPosition, center, _worldScale, sin, cos);
            _uvB.set(0, 1);

            intersect = raycaster.ray.intersectTriangle(_vA, _vC, _vB, false, _intersectPoint);
            if (intersect === null) {
                return;
            }

        }

        const distance = raycaster.ray.origin.distanceTo(_intersectPoint);

        if (distance < raycaster.near || distance > raycaster.far) return;

        intersects.push({
            distance: distance,
            point: _intersectPoint.clone(),
            uv: Triangle.getInterpolation(_intersectPoint, _vA, _vB, _vC, _uvA, _uvB, _uvC, new Vector2()),
            face: null,
            object: this,
            instanceId: this._instanceIndex,
        });
    }
};

export default InstancedSprite;
export { InstancedSprite };
