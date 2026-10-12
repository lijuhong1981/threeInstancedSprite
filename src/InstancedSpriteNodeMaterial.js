import { attribute, cameraProjectionMatrix, cos, Discard, float, floor, fract, Fn, If, modelViewMatrix, positionGeometry, sin, texture, uniform, uniformTexture, uv, varying, vec2, vec4, } from 'three/tsl';
import { NodeMaterial, Texture } from 'three/webgpu';

// 深度编码常量（与 @lijuhong1981/picking 的 depthMaterial 保持一致）
const PackUpscale = 256.0 / 255.0;
const ShiftRight8 = 1.0 / 256.0;
const Inv255 = 1.0 / 255.0;
const PackFactorsZ = 256.0 * 256.0; // PackFactors.z

/**
 * InstancedSpriteNodeMaterial 材质类，基于 Three.js TSL (Three Shading Language) 语法实现
 *
 * 功能与 InstancedSpriteMaterial (ShaderMaterial) 完全相同，但使用 TSL 节点系统构建，
 * 可更好地与 Three.js 的 NodeMaterial 管线集成（自动处理色调映射、色彩空间转换等）。
 *
 * **注意**：使用此类需要 Three.js 的 WebGPU/TSL 构建（`three/webgpu`），非标准 `three` 构建。
 *
 * @extends NodeMaterial
 */
class InstancedSpriteNodeMaterial extends NodeMaterial {
    constructor() {
        super();

        // --- 材质属性 ---
        this.transparent = true;
        this.depthTest = true;
        this.depthWrite = true;

        // 关闭 NodeMaterial 默认的雾效/光照，与原始 ShaderMaterial 行为一致
        this.fog = false;
        this.lights = false;

        // 纹理 Uniform 节点（可延迟赋值，使用空纹理保证节点类型稳定）
        this._textureNode = uniformTexture();
        // 深度模式开关 Uniform 节点
        this._enableDepthNode = uniform(0.0);

        this._setupShader();
    }

    /**
     * 使用 TSL 节点系统构建顶点/片元着色器
     * @private
     */
    _setupShader() {
        // ============================================================
        // 实例属性 (InstancedBufferAttribute) 节点
        // ============================================================
        const aPositionAndShow = attribute('aPositionAndShow', 'vec4');
        const aCenterAndSize = attribute('aCenterAndSize', 'vec4');
        const aScaleAndRotationAndSizeAttenuation = attribute('aScaleAndRotationAndSizeAttenuation', 'vec3');
        const aColorAndOpacity = attribute('aColorAndOpacity', 'vec4');
        const aPickColorAndEnabled = attribute('aPickColorAndEnabled', 'vec4');
        const aUvRect = attribute('aUvRect', 'vec4');

        // ============================================================
        // Varying 变量 — 从顶点着色器传递到片元着色器
        // ============================================================
        const vShow = varying(float(1));
        const vColorAndOpacity = varying(vec4(1));
        const vUv = varying(vec2(1));
        const vPickColorAndEnabled = varying(vec4(1));
        const vHighPrecisionZW = varying(vec2(1));

        // ============================================================
        // 顶点着色器 (vertexNode)
        // ============================================================
        this.vertexNode = Fn(() => {
            // --- 1. 解包实例属性 ---
            const show = aPositionAndShow.w;
            const scale = aScaleAndRotationAndSizeAttenuation.x;
            const rotation = aScaleAndRotationAndSizeAttenuation.y;
            const sizeAttenuation = aScaleAndRotationAndSizeAttenuation.z;
            const center = aCenterAndSize.xy;
            const imageSize = aCenterAndSize.zw;

            // --- 2. 输出 varying ---
            vShow.assign(show);
            vColorAndOpacity.assign(aColorAndOpacity);
            vUv.assign(aUvRect.xy.add(uv().mul(aUvRect.zw)));
            vPickColorAndEnabled.assign(aPickColorAndEnabled);

            // --- 3. 计算模型视图位置 ---
            const mvPosition = modelViewMatrix.mul(vec4(aPositionAndShow.xyz, 1));
            const depth = mvPosition.z.negate();

            // 默认把顶点放到裁剪空间外；只有有效实例才覆盖为真实位置。
            // 避免在 TSL 的 If callback 中依赖 JS return，也避免 imageSize.y 为 0 时继续做除法。
            const clipPosition = vec4(0, 0, 2, 1).toVar('clipPosition');
            const isVisible = show.greaterThanEqual(0.5)
                .and(imageSize.x.greaterThan(0))
                .and(imageSize.y.greaterThan(0))
                .and(depth.greaterThan(0));

            If(isVisible, () => {
                // --- 4. sizeAttenuation：大小跟随相机深度 ---
                // 检查是否为透视投影：透视投影矩阵 m[2][3] (elements[11]) == -1
                const scaleFactor = sizeAttenuation.lessThan(0.5).and(cameraProjectionMatrix.element(2).w.equal(-1))
                    .select(scale.mul(depth), scale);

                // --- 5. 坐标对齐 ---
                // 原始GLSL: (position.xy - (center - vec2(0.5))) * aspectRatio * scale
                const aspectRatio = imageSize.x.div(imageSize.y);
                const alignedPosition = positionGeometry.xy
                    .sub(center.sub(vec2(0.5)))
                    .mul(aspectRatio)
                    .mul(scaleFactor);

                // --- 6. 计算旋转 ---
                // 原始GLSL: cos(rotation) * x - sin(rotation) * y
                const cosR = cos(rotation);
                const sinR = sin(rotation);
                const rotatedX = cosR.mul(alignedPosition.x).sub(sinR.mul(alignedPosition.y));
                const rotatedY = sinR.mul(alignedPosition.x).add(cosR.mul(alignedPosition.y));

                // --- 7. 将旋转偏移叠加到视图空间位置 ---
                const finalMvPosition = vec4(
                    mvPosition.x.add(rotatedX),
                    mvPosition.y.add(rotatedY),
                    mvPosition.z,
                    mvPosition.w
                );

                // --- 8. 投影变换（返回 clip-space 坐标）---
                // 使用 cameraProjectionMatrix 替代原始GLSL中的 projectionMatrix
                clipPosition.assign(cameraProjectionMatrix.mul(finalMvPosition));
                vHighPrecisionZW.assign(clipPosition.zw);
            }).Else(() => {
                vShow.assign(float(0));
            });

            return clipPosition;
        }).once()();

        // ============================================================
        // 片元着色器 (fragmentNode)
        // ============================================================
        this.fragmentNode = Fn(() => {
            Discard(vShow.lessThan(0.5));

            const enablePickColor = vPickColorAndEnabled.w.greaterThan(0.5);
            const diffuseColor = vec4(0, 0, 0, 1).toVar('diffuseColor');

            // 深度编码（与 @lijuhong1981/picking 的 depthMaterial 保持一致）
            const depth01 = vHighPrecisionZW.x.div(vHighPrecisionZW.y).mul(0.5).add(0.5);
            const scaled = depth01.mul(PackFactorsZ);
            const vuf0 = floor(scaled);
            const bf = fract(scaled);
            const vufDiv = vuf0.mul(ShiftRight8);
            const gf = fract(vufDiv);
            const vuf1 = floor(vufDiv);
            const packedDepth = vec4(vuf1.mul(Inv255), gf.mul(PackUpscale), bf, 1.0);

            If(this._enableDepthNode.greaterThan(0.5), () => {
                // 深度模式：输出深度编码颜色
                diffuseColor.assign(packedDepth);
            }).Else(() => {
                If(enablePickColor, () => {
                    // 拾取模式：直接输出拾取颜色，不受纹理/透明度影响
                    diffuseColor.assign(vec4(vPickColorAndEnabled.xyz, 1));
                }).Else(() => {
                    // 采样纹理
                    const texColor = texture(this._textureNode, vUv);
                    const color = texColor.mul(vColorAndOpacity);

                    // 丢弃完全透明的像素
                    Discard(color.a.lessThan(0.005));

                    diffuseColor.assign(color);
                });
            });

            return diffuseColor;
        }).once()();
    }
    /**
     * InstancedSpriteNodeMaterial对象标识
     * @type {boolean}
     * @readonly
    */
    get isBillboardNodeMaterial() { return true; }
    /**
     * 图片纹理
     * @type {Texture|null}
     */
    get texture() {
        return this._textureNode.value;
    }
    set texture(value) {
        this._textureNode.value = value;
    }
    /**
     * 深度模式开关，用于GPU深度拾取，由Picking管理器设置和使用，用户无需关心
     * @type {boolean}
    */
    set enableDepth(value) {
        this._enableDepthNode.value = value ? 1 : 0;
    }
    get enableDepth() {
        return this._enableDepthNode.value > 0.5;
    }
};

export default InstancedSpriteNodeMaterial;
export { InstancedSpriteNodeMaterial };
/**
 * InstancedSpriteNodeMaterial 的别名。
 * @class
 * @name BillboardNodeMaterial
 */
export const BillboardNodeMaterial = InstancedSpriteNodeMaterial;
