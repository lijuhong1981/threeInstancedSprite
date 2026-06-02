import { ShaderMaterial, Texture } from "three";

const vertexShader = `
// Three.js ShaderMaterial专用，自动注入uv、position、modelViewMatrix、projectionMatrix
precision highp float;
precision highp int;

#include <common>
#include <logdepthbuf_pars_vertex>

// 基础属性
attribute vec4 aPositionAndShow; // xyz: InstancedSprite位置（世界空间），w：显示标志(0/1)
attribute vec4 aCenterAndSize; // xy: 锚点中心(0-1), zw: 图片宽高(像素/米)
attribute vec3 aScaleAndRotationAndSizeAttenuation; // x: 缩放, y: 旋转(弧度), z: 大小跟随相机深度(0/1)
attribute vec4 aColorAndOpacity; // RGBA颜色

varying float vShow;
varying vec2 vUv;
varying vec4 vColorAndOpacity;

void main() {
    // --- 1. 提前解包属性（GPU会自动优化，无性能损失）---
    float show = aPositionAndShow.w;
    float scale = aScaleAndRotationAndSizeAttenuation.x;
    float rotation = aScaleAndRotationAndSizeAttenuation.y;
    float sizeAttenuation = aScaleAndRotationAndSizeAttenuation.z;
    vec2 center = aCenterAndSize.xy;
    vec2 imageSize = aCenterAndSize.zw;

    // --- 2. 输出varying变量 ---
    vShow = show;
    vUv = uv;
    vColorAndOpacity = aColorAndOpacity;

    // --- 3. 提前隐藏不可见物体（顶点级丢弃，性能最优）---
    if (show < 0.5 || imageSize.x <= 0.0 || imageSize.y <= 0.0) {
        vShow = 0.0;
        gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
        return;
    }

    // --- 4. 计算模型视图位置 ---
    vec4 mvPosition = modelViewMatrix * vec4(aPositionAndShow.xyz, 1.0);

    // --- 5. 深度检查：隐藏相机后面的物体，避免尺寸翻转 ---
    float depth = -mvPosition.z;
    if (depth <= 0.0) {
        vShow = 0.0;
        gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
        return;
    }

    // --- 6. sizeAttenuation检查：大小跟随深度
    if (sizeAttenuation < 0.5) {
        bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= depth;
    }

    // --- 7. 坐标对齐
    float aspectRatio = imageSize.x / imageSize.y;
    vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * aspectRatio * scale;

    // --- 8. 计算旋转
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;

    // --- 9. 投影变换 ---
    gl_Position = projectionMatrix * mvPosition;

    #include <logdepthbuf_vertex>
}
`;

const fragmentShader = `
uniform sampler2D uTexture;

#include <common>
#include <logdepthbuf_pars_fragment>

varying float vShow;
varying vec2 vUv;
varying vec4 vColorAndOpacity;

void main() {
    vec4 texColor = texture2D(uTexture, vUv);
    vec4 diffuseColor = texColor * vColorAndOpacity;

    // 丢弃完全透明的像素
    if (diffuseColor.a < 0.005 || vShow < 0.5) {
        discard;
    }

    gl_FragColor = diffuseColor;

    #include <logdepthbuf_fragment>
    #include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

/**
 * InstancedSprite 材质类，以attribute形式传入InstancedSprite对象实例属性
 * 
 * @extends ShaderMaterial
*/
class InstancedSpriteMaterial extends ShaderMaterial {
    constructor() {
        super({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTexture: { value: null },
            },
            transparent: true,
            depthTest: true,
            depthWrite: true,
        });
    }
    /**
     * 图片纹理
     * @type {Texture}
    */
    set texture(value) {
        this.uniforms.uTexture.value = value;
    }
    get texture() {
        return this.uniforms.uTexture.value;
    }
};

export default InstancedSpriteMaterial;
export { InstancedSpriteMaterial };