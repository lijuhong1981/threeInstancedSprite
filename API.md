## Classes

<dl>
<dt><a href="#InstancedSprite">InstancedSprite</a></dt>
<dd><p>InstancedSprite 数据模型类，用于存储单个 InstancedSprite 的所有属性</p>
<ul>
<li>InstancedSprite跟Sprite不同，它只是一个数据集合对象，并不继承自Object3D，不能直接加入到Scene中</li>
<li>但它可以作为属性Module使用，修改InstancedSprite的属性会自动更新至GPU中</li>
</ul>
</dd>
<dt><a href="#InstancedSpriteCollection">InstancedSpriteCollection</a> ⇐ <code>Object3D</code></dt>
<dd><p>InstancedSpriteCollection类，批量管理InstancedSprite实例</p>
<ul>
<li>继承自Object3D</li>
<li>根据InstancedSprite的图像属性生成InstancedSpriteMaterial和InstancedSpriteMesh，</li>
<li>管理InstancedSprite与InstancedSpriteMesh实例</li>
</ul>
</dd>
<dt><a href="#InstancedSpriteMaterial">InstancedSpriteMaterial</a> ⇐ <code>ShaderMaterial</code></dt>
<dd><p>InstancedSprite 材质类，以attribute形式传入InstancedSprite对象实例属性</p>
</dd>
<dt><a href="#InstancedSpriteMesh">InstancedSpriteMesh</a> ⇐ <code>Mesh</code></dt>
<dd><p>InstancedSpriteMesh类，基于InstancedBufferGeometry实现的高性能InstancedSprite渲染组件</p>
</dd>
<dt><a href="#InstancedSpriteNodeMaterial">InstancedSpriteNodeMaterial</a> ⇐ <code>NodeMaterial</code></dt>
<dd><p>InstancedSpriteNodeMaterial 材质类，基于 Three.js TSL (Three Shading Language) 语法实现</p>
<p>功能与 InstancedSpriteMaterial (ShaderMaterial) 完全相同，但使用 TSL 节点系统构建，
可更好地与 Three.js 的 NodeMaterial 管线集成（自动处理色调映射、色彩空间转换等）。</p>
<p><strong>注意</strong>：使用此类需要 Three.js 的 WebGPU/TSL 构建（<code>three/webgpu</code>），非标准 <code>three</code> 构建。</p>
</dd>
</dl>

## Constants

<dl>
<dt><a href="#imageLoader">imageLoader</a></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#InstancedSpriteOptions">InstancedSpriteOptions</a> : <code>object</code></dt>
<dd><p>InstancedSprite 对象配置项选项</p>
</dd>
</dl>

<a name="InstancedSprite"></a>

## InstancedSprite
InstancedSprite 数据模型类，用于存储单个 InstancedSprite 的所有属性

* InstancedSprite跟Sprite不同，它只是一个数据集合对象，并不继承自Object3D，不能直接加入到Scene中
* 但它可以作为属性Module使用，修改InstancedSprite的属性会自动更新至GPU中

**Kind**: global class  

* [InstancedSprite](#InstancedSprite)
    * [new InstancedSprite(options, collection)](#new_InstancedSprite_new)
    * [.type](#InstancedSprite+type) : <code>string</code>
    * [.uuid](#InstancedSprite+uuid) : <code>string</code>
    * [.show](#InstancedSprite+show) : <code>boolean</code>
    * [.position](#InstancedSprite+position) : <code>Vector3</code>
    * [.scale](#InstancedSprite+scale) : <code>number</code>
    * [.rotation](#InstancedSprite+rotation) : <code>number</code>
    * [.sizeAttenuation](#InstancedSprite+sizeAttenuation) : <code>boolean</code>
    * [.center](#InstancedSprite+center) : <code>Vector2</code>
    * [.color](#InstancedSprite+color) : <code>Color</code>
    * [.opacity](#InstancedSprite+opacity) : <code>number</code>
    * [.imageSize](#InstancedSprite+imageSize) : <code>Vector2</code>
    * [.userData](#InstancedSprite+userData) : <code>object</code>
    * [.isInstancedSprite](#InstancedSprite+isInstancedSprite) : <code>boolean</code>
    * [.visible](#InstancedSprite+visible) : <code>boolean</code>
    * [.rotationDegrees](#InstancedSprite+rotationDegrees) : <code>number</code>
    * [.image](#InstancedSprite+image) : <code>string</code> \| <code>HTMLImageElement</code> \| <code>HTMLCanvasElement</code>
    * [.imageId](#InstancedSprite+imageId) : <code>string</code>
    * [.imageWidth](#InstancedSprite+imageWidth) : <code>number</code>
    * [.imageHeight](#InstancedSprite+imageHeight) : <code>number</code>
    * [.geometry](#InstancedSprite+geometry) : <code>InstancedBufferGeometry</code>
    * [.material](#InstancedSprite+material) : [<code>InstancedSpriteMaterial</code>](#InstancedSpriteMaterial) \| [<code>InstancedSpriteNodeMaterial</code>](#InstancedSpriteNodeMaterial)
    * [.setValues(options)](#InstancedSprite+setValues) ⇒ [<code>InstancedSprite</code>](#InstancedSprite)
    * [.remove()](#InstancedSprite+remove) ⇒ [<code>InstancedSprite</code>](#InstancedSprite)
    * [.raycast(raycaster, intersects, modelViewMatrix)](#InstancedSprite+raycast)

<a name="new_InstancedSprite_new"></a>

### new InstancedSprite(options, collection)

| Param | Type | Description |
| --- | --- | --- |
| options | [<code>InstancedSpriteOptions</code>](#InstancedSpriteOptions) | 初始化配置项 |
| collection | [<code>InstancedSpriteCollection</code>](#InstancedSpriteCollection) | 所属InstancedSpriteCollection实例，必填 |

<a name="InstancedSprite+type"></a>

### instancedSprite.type : <code>string</code>
对象类型标识

**Kind**: instance property of [<code>InstancedSprite</code>](#InstancedSprite)  
**Read only**: true  
<a name="InstancedSprite+uuid"></a>

### instancedSprite.uuid : <code>string</code>
当前InstancedSprite的唯一标识id

**Kind**: instance property of [<code>InstancedSprite</code>](#InstancedSprite)  
**Read only**: true  
<a name="InstancedSprite+show"></a>

### instancedSprite.show : <code>boolean</code>
是否显示

**Kind**: instance property of [<code>InstancedSprite</code>](#InstancedSprite)  
<a name="InstancedSprite+position"></a>

### instancedSprite.position : <code>Vector3</code>
世界坐标位置

**Kind**: instance property of [<code>InstancedSprite</code>](#InstancedSprite)  
<a name="InstancedSprite+scale"></a>

### instancedSprite.scale : <code>number</code>
缩放

**Kind**: instance property of [<code>InstancedSprite</code>](#InstancedSprite)  
<a name="InstancedSprite+rotation"></a>

### instancedSprite.rotation : <code>number</code>
旋转（弧度）

**Kind**: instance property of [<code>InstancedSprite</code>](#InstancedSprite)  
<a name="InstancedSprite+sizeAttenuation"></a>

### instancedSprite.sizeAttenuation : <code>boolean</code>
尺寸是否跟随相机深度变化

**Kind**: instance property of [<code>InstancedSprite</code>](#InstancedSprite)  
<a name="InstancedSprite+center"></a>

### instancedSprite.center : <code>Vector2</code>
锚点中心（0-1）

**Kind**: instance property of [<code>InstancedSprite</code>](#InstancedSprite)  
<a name="InstancedSprite+color"></a>

### instancedSprite.color : <code>Color</code>
颜色

**Kind**: instance property of [<code>InstancedSprite</code>](#InstancedSprite)  
<a name="InstancedSprite+opacity"></a>

### instancedSprite.opacity : <code>number</code>
不透明度（0-1）

**Kind**: instance property of [<code>InstancedSprite</code>](#InstancedSprite)  
<a name="InstancedSprite+imageSize"></a>

### instancedSprite.imageSize : <code>Vector2</code>
图片尺寸（像素），图片加载完成后可用

**Kind**: instance property of [<code>InstancedSprite</code>](#InstancedSprite)  
**Read only**: true  
<a name="InstancedSprite+userData"></a>

### instancedSprite.userData : <code>object</code>
用户自定义数据存储对象，InstancedSprite本身不使用该属性，用户可以自由使用它来存储任意数据

**Kind**: instance property of [<code>InstancedSprite</code>](#InstancedSprite)  
**Read only**: true  
<a name="InstancedSprite+isInstancedSprite"></a>

### instancedSprite.isInstancedSprite : <code>boolean</code>
InstancedSprite对象标识

**Kind**: instance property of [<code>InstancedSprite</code>](#InstancedSprite)  
**Read only**: true  
<a name="InstancedSprite+visible"></a>

### instancedSprite.visible : <code>boolean</code>
是否可见，等同于show

**Kind**: instance property of [<code>InstancedSprite</code>](#InstancedSprite)  
<a name="InstancedSprite+rotationDegrees"></a>

### instancedSprite.rotationDegrees : <code>number</code>
旋转（角度）

**Kind**: instance property of [<code>InstancedSprite</code>](#InstancedSprite)  
<a name="InstancedSprite+image"></a>

### instancedSprite.image : <code>string</code> \| <code>HTMLImageElement</code> \| <code>HTMLCanvasElement</code>
图片资源，可以是URL字符串、HTMLImageElement或HTMLCanvasElement

**Kind**: instance property of [<code>InstancedSprite</code>](#InstancedSprite)  
<a name="InstancedSprite+imageId"></a>

### instancedSprite.imageId : <code>string</code>
图片ID，图片加载完成后可用，通常为图片URL或生成的UUID

**Kind**: instance property of [<code>InstancedSprite</code>](#InstancedSprite)  
**Read only**: true  
<a name="InstancedSprite+imageWidth"></a>

### instancedSprite.imageWidth : <code>number</code>
图片像素宽度，图片加载完成后可用

**Kind**: instance property of [<code>InstancedSprite</code>](#InstancedSprite)  
**Read only**: true  
<a name="InstancedSprite+imageHeight"></a>

### instancedSprite.imageHeight : <code>number</code>
图片像素高度，图片加载完成后可用

**Kind**: instance property of [<code>InstancedSprite</code>](#InstancedSprite)  
**Read only**: true  
<a name="InstancedSprite+geometry"></a>

### instancedSprite.geometry : <code>InstancedBufferGeometry</code>
InstancedSprite对象的几何体属性

**Kind**: instance property of [<code>InstancedSprite</code>](#InstancedSprite)  
**Read only**: true  
<a name="InstancedSprite+material"></a>

### instancedSprite.material : [<code>InstancedSpriteMaterial</code>](#InstancedSpriteMaterial) \| [<code>InstancedSpriteNodeMaterial</code>](#InstancedSpriteNodeMaterial)
InstancedSprite对象的材质属性，可能是InstancedSpriteMaterial或InstancedSpriteNodeMaterial

**Kind**: instance property of [<code>InstancedSprite</code>](#InstancedSprite)  
**Read only**: true  
<a name="InstancedSprite+setValues"></a>

### instancedSprite.setValues(options) ⇒ [<code>InstancedSprite</code>](#InstancedSprite)
设置参数

**Kind**: instance method of [<code>InstancedSprite</code>](#InstancedSprite)  

| Param | Type |
| --- | --- |
| options | [<code>InstancedSpriteOptions</code>](#InstancedSpriteOptions) | 

<a name="InstancedSprite+remove"></a>

### instancedSprite.remove() ⇒ [<code>InstancedSprite</code>](#InstancedSprite)
从Mesh中移除该InstancedSprite对象

**Kind**: instance method of [<code>InstancedSprite</code>](#InstancedSprite)  
<a name="InstancedSprite+raycast"></a>

### instancedSprite.raycast(raycaster, intersects, modelViewMatrix)
Computes intersection points between a casted ray and this sprite.

**Kind**: instance method of [<code>InstancedSprite</code>](#InstancedSprite)  

| Param | Type | Description |
| --- | --- | --- |
| raycaster | <code>Raycaster</code> | The raycaster. |
| intersects | <code>Array.&lt;Object&gt;</code> | The target array that holds the intersection points. |
| modelViewMatrix | <code>Matrix4</code> |  |

<a name="InstancedSpriteCollection"></a>

## InstancedSpriteCollection ⇐ <code>Object3D</code>
InstancedSpriteCollection类，批量管理InstancedSprite实例

* 继承自Object3D
* 根据InstancedSprite的图像属性生成InstancedSpriteMaterial和InstancedSpriteMesh，
* 管理InstancedSprite与InstancedSpriteMesh实例

**Kind**: global class  
**Extends**: <code>Object3D</code>  

* [InstancedSpriteCollection](#InstancedSpriteCollection) ⇐ <code>Object3D</code>
    * [new InstancedSpriteCollection([useNodeMaterial])](#new_InstancedSpriteCollection_new)
    * [.useNodeMaterial](#InstancedSpriteCollection+useNodeMaterial) : <code>boolean</code>
    * [.type](#InstancedSpriteCollection+type) : <code>string</code>
    * [.isInstancedSpriteCollection](#InstancedSpriteCollection+isInstancedSpriteCollection) : <code>boolean</code>
    * [.depthTest](#InstancedSpriteCollection+depthTest) : <code>boolean</code>
    * [.instancedSprites](#InstancedSpriteCollection+instancedSprites) : [<code>Array.&lt;InstancedSprite&gt;</code>](#InstancedSprite)
    * [.size](#InstancedSpriteCollection+size) : <code>number</code>
    * [._setImage(source, sprite)](#InstancedSpriteCollection+_setImage)
    * [.get(index)](#InstancedSpriteCollection+get) ⇒ [<code>InstancedSprite</code>](#InstancedSprite) \| <code>undefined</code>
    * [.getByUuid(uuid)](#InstancedSpriteCollection+getByUuid) ⇒ [<code>InstancedSprite</code>](#InstancedSprite) \| <code>undefined</code>
    * [.add()](#InstancedSpriteCollection+add) ⇒ [<code>InstancedSprite</code>](#InstancedSprite)
    * [.remove(sprite)](#InstancedSpriteCollection+remove) ⇒ [<code>InstancedSpriteCollection</code>](#InstancedSpriteCollection)
    * [.forEach(callback)](#InstancedSpriteCollection+forEach) ⇒ [<code>InstancedSpriteCollection</code>](#InstancedSpriteCollection)
    * [.raycast(raycaster, intersects)](#InstancedSpriteCollection+raycast)

<a name="new_InstancedSpriteCollection_new"></a>

### new InstancedSpriteCollection([useNodeMaterial])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [useNodeMaterial] | <code>boolean</code> | <code>false</code> | 是否使用TSL的NodeMaterial，默认false |

<a name="InstancedSpriteCollection+useNodeMaterial"></a>

### instancedSpriteCollection.useNodeMaterial : <code>boolean</code>
是否使用TSL的NodeMaterial，默认false

**Kind**: instance property of [<code>InstancedSpriteCollection</code>](#InstancedSpriteCollection)  
**Default**: <code>false</code>  
**Read only**: true  
<a name="InstancedSpriteCollection+type"></a>

### instancedSpriteCollection.type : <code>string</code>
对象类型标识

**Kind**: instance property of [<code>InstancedSpriteCollection</code>](#InstancedSpriteCollection)  
**Read only**: true  
<a name="InstancedSpriteCollection+isInstancedSpriteCollection"></a>

### instancedSpriteCollection.isInstancedSpriteCollection : <code>boolean</code>
InstancedSpriteCollection对象标识

**Kind**: instance property of [<code>InstancedSpriteCollection</code>](#InstancedSpriteCollection)  
**Read only**: true  
<a name="InstancedSpriteCollection+depthTest"></a>

### instancedSpriteCollection.depthTest : <code>boolean</code>
深度测试开关，默认为true，开启后会进行深度测试以正确处理遮挡关系，但可能会有性能影响；如果关闭则所有InstancedSprite都会被渲染在最前面，适合需要始终显示的UI元素等场景

**Kind**: instance property of [<code>InstancedSpriteCollection</code>](#InstancedSpriteCollection)  
**Default**: <code>true</code>  
<a name="InstancedSpriteCollection+instancedSprites"></a>

### instancedSpriteCollection.instancedSprites : [<code>Array.&lt;InstancedSprite&gt;</code>](#InstancedSprite)
InstancedSprite实例数组

**Kind**: instance property of [<code>InstancedSpriteCollection</code>](#InstancedSpriteCollection)  
**Read only**: true  
<a name="InstancedSpriteCollection+size"></a>

### instancedSpriteCollection.size : <code>number</code>
InstancedSprite实例数量

**Kind**: instance property of [<code>InstancedSpriteCollection</code>](#InstancedSpriteCollection)  
**Read only**: true  
<a name="InstancedSpriteCollection+_setImage"></a>

### instancedSpriteCollection.\_setImage(source, sprite)
**Kind**: instance method of [<code>InstancedSpriteCollection</code>](#InstancedSpriteCollection)  

| Param | Type |
| --- | --- |
| source | <code>string</code> \| <code>HTMLImageElement</code> \| <code>HTMLCanvasElement</code> | 
| sprite | [<code>InstancedSprite</code>](#InstancedSprite) | 

<a name="InstancedSpriteCollection+get"></a>

### instancedSpriteCollection.get(index) ⇒ [<code>InstancedSprite</code>](#InstancedSprite) \| <code>undefined</code>
根据索引获取InstancedSprite实例

**Kind**: instance method of [<code>InstancedSpriteCollection</code>](#InstancedSpriteCollection)  

| Param | Type |
| --- | --- |
| index | <code>number</code> | 

<a name="InstancedSpriteCollection+getByUuid"></a>

### instancedSpriteCollection.getByUuid(uuid) ⇒ [<code>InstancedSprite</code>](#InstancedSprite) \| <code>undefined</code>
根据uuid获取InstancedSprite实例

**Kind**: instance method of [<code>InstancedSpriteCollection</code>](#InstancedSpriteCollection)  

| Param | Type |
| --- | --- |
| uuid | <code>string</code> | 

<a name="InstancedSpriteCollection+add"></a>

### instancedSpriteCollection.add() ⇒ [<code>InstancedSprite</code>](#InstancedSprite)
添加InstancedSprite

**Kind**: instance method of [<code>InstancedSpriteCollection</code>](#InstancedSpriteCollection)  
<a name="InstancedSpriteCollection+remove"></a>

### instancedSpriteCollection.remove(sprite) ⇒ [<code>InstancedSpriteCollection</code>](#InstancedSpriteCollection)
移除InstancedSprite

**Kind**: instance method of [<code>InstancedSpriteCollection</code>](#InstancedSpriteCollection)  

| Param | Type |
| --- | --- |
| sprite | [<code>InstancedSprite</code>](#InstancedSprite) | 

<a name="InstancedSpriteCollection+forEach"></a>

### instancedSpriteCollection.forEach(callback) ⇒ [<code>InstancedSpriteCollection</code>](#InstancedSpriteCollection)
遍历所有的InstancedSprite

**Kind**: instance method of [<code>InstancedSpriteCollection</code>](#InstancedSpriteCollection)  

| Param | Type |
| --- | --- |
| callback | <code>function</code> | 

<a name="InstancedSpriteCollection+raycast"></a>

### instancedSpriteCollection.raycast(raycaster, intersects)
Computes intersection points between a casted ray and this sprite.

**Kind**: instance method of [<code>InstancedSpriteCollection</code>](#InstancedSpriteCollection)  

| Param | Type | Description |
| --- | --- | --- |
| raycaster | <code>Raycaster</code> | The raycaster. |
| intersects | <code>Array.&lt;Object&gt;</code> | The target array that holds the intersection points. |

<a name="InstancedSpriteMaterial"></a>

## InstancedSpriteMaterial ⇐ <code>ShaderMaterial</code>
InstancedSprite 材质类，以attribute形式传入InstancedSprite对象实例属性

**Kind**: global class  
**Extends**: <code>ShaderMaterial</code>  
<a name="InstancedSpriteMaterial+texture"></a>

### instancedSpriteMaterial.texture : <code>Texture</code>
图片纹理

**Kind**: instance property of [<code>InstancedSpriteMaterial</code>](#InstancedSpriteMaterial)  
<a name="InstancedSpriteMesh"></a>

## InstancedSpriteMesh ⇐ <code>Mesh</code>
InstancedSpriteMesh类，基于InstancedBufferGeometry实现的高性能InstancedSprite渲染组件

**Kind**: global class  
**Extends**: <code>Mesh</code>  

* [InstancedSpriteMesh](#InstancedSpriteMesh) ⇐ <code>Mesh</code>
    * [new InstancedSpriteMesh(collection, texture)](#new_InstancedSpriteMesh_new)
    * [.type](#InstancedSpriteMesh+type) : <code>string</code>
    * [.isInstancedSpriteMesh](#InstancedSpriteMesh+isInstancedSpriteMesh) : <code>boolean</code>
    * [.depthTest](#InstancedSpriteMesh+depthTest) : <code>boolean</code>
    * [.instancedSprites](#InstancedSpriteMesh+instancedSprites) : [<code>Array.&lt;InstancedSprite&gt;</code>](#InstancedSprite)
    * [.add(sprite)](#InstancedSpriteMesh+add) ⇒ [<code>InstancedSpriteMesh</code>](#InstancedSpriteMesh)
    * [.remove(sprite)](#InstancedSpriteMesh+remove) ⇒ [<code>InstancedSpriteMesh</code>](#InstancedSpriteMesh)
    * [.clear()](#InstancedSpriteMesh+clear) ⇒ [<code>InstancedSpriteMesh</code>](#InstancedSpriteMesh)
    * [.raycast(raycaster, intersects)](#InstancedSpriteMesh+raycast)

<a name="new_InstancedSpriteMesh_new"></a>

### new InstancedSpriteMesh(collection, texture)

| Param | Type | Description |
| --- | --- | --- |
| collection | [<code>InstancedSpriteCollection</code>](#InstancedSpriteCollection) | 所属的InstancedSpriteCollection实例，必填 |
| texture | <code>Texture</code> | 材质图像纹理，必填 |

<a name="InstancedSpriteMesh+type"></a>

### instancedSpriteMesh.type : <code>string</code>
对象类型标识

**Kind**: instance property of [<code>InstancedSpriteMesh</code>](#InstancedSpriteMesh)  
**Read only**: true  
<a name="InstancedSpriteMesh+isInstancedSpriteMesh"></a>

### instancedSpriteMesh.isInstancedSpriteMesh : <code>boolean</code>
InstancedSpriteMesh对象标识

**Kind**: instance property of [<code>InstancedSpriteMesh</code>](#InstancedSpriteMesh)  
**Read only**: true  
<a name="InstancedSpriteMesh+depthTest"></a>

### instancedSpriteMesh.depthTest : <code>boolean</code>
深度测试开关，默认为true，开启后会进行深度测试以正确处理遮挡关系，但可能会有性能影响；如果关闭则所有InstancedSprite都会被渲染在最前面，适合需要始终显示的UI元素等场景

**Kind**: instance property of [<code>InstancedSpriteMesh</code>](#InstancedSpriteMesh)  
**Default**: <code>true</code>  
<a name="InstancedSpriteMesh+instancedSprites"></a>

### instancedSpriteMesh.instancedSprites : [<code>Array.&lt;InstancedSprite&gt;</code>](#InstancedSprite)
InstancedSprite对象数组

**Kind**: instance property of [<code>InstancedSpriteMesh</code>](#InstancedSpriteMesh)  
**Read only**: true  
<a name="InstancedSpriteMesh+add"></a>

### instancedSpriteMesh.add(sprite) ⇒ [<code>InstancedSpriteMesh</code>](#InstancedSpriteMesh)
添加一个InstancedSprite

**Kind**: instance method of [<code>InstancedSpriteMesh</code>](#InstancedSpriteMesh)  

| Param | Type | Description |
| --- | --- | --- |
| sprite | [<code>InstancedSprite</code>](#InstancedSprite) | 要添加的InstancedSprite实例 |

<a name="InstancedSpriteMesh+remove"></a>

### instancedSpriteMesh.remove(sprite) ⇒ [<code>InstancedSpriteMesh</code>](#InstancedSpriteMesh)
移除一个InstancedSprite

**Kind**: instance method of [<code>InstancedSpriteMesh</code>](#InstancedSpriteMesh)  

| Param | Type | Description |
| --- | --- | --- |
| sprite | [<code>InstancedSprite</code>](#InstancedSprite) | 要移除的InstancedSprite实例 |

<a name="InstancedSpriteMesh+clear"></a>

### instancedSpriteMesh.clear() ⇒ [<code>InstancedSpriteMesh</code>](#InstancedSpriteMesh)
移除所有InstancedSprite

**Kind**: instance method of [<code>InstancedSpriteMesh</code>](#InstancedSpriteMesh)  
<a name="InstancedSpriteMesh+raycast"></a>

### instancedSpriteMesh.raycast(raycaster, intersects)
Computes intersection points between a casted ray and this sprite.

**Kind**: instance method of [<code>InstancedSpriteMesh</code>](#InstancedSpriteMesh)  

| Param | Type | Description |
| --- | --- | --- |
| raycaster | <code>Raycaster</code> | The raycaster. |
| intersects | <code>Array.&lt;Object&gt;</code> | The target array that holds the intersection points. |

<a name="InstancedSpriteNodeMaterial"></a>

## InstancedSpriteNodeMaterial ⇐ <code>NodeMaterial</code>
InstancedSpriteNodeMaterial 材质类，基于 Three.js TSL (Three Shading Language) 语法实现

功能与 InstancedSpriteMaterial (ShaderMaterial) 完全相同，但使用 TSL 节点系统构建，
可更好地与 Three.js 的 NodeMaterial 管线集成（自动处理色调映射、色彩空间转换等）。

**注意**：使用此类需要 Three.js 的 WebGPU/TSL 构建（`three/webgpu`），非标准 `three` 构建。

**Kind**: global class  
**Extends**: <code>NodeMaterial</code>  
<a name="InstancedSpriteNodeMaterial+texture"></a>

### instancedSpriteNodeMaterial.texture : <code>Texture</code> \| <code>null</code>
图片纹理

**Kind**: instance property of [<code>InstancedSpriteNodeMaterial</code>](#InstancedSpriteNodeMaterial)  
<a name="imageLoader"></a>

## imageLoader
**Kind**: global constant  
**Import**: InstancedSpriteCollection from "./InstancedSpriteCollection.js";  
**Import**: InstancedSpriteMesh from "./InstancedSpriteMesh.js";  
**Import**: InstancedSpriteMaterial from "./InstancedSpriteMaterial.js";  
**Import**: InstancedSpriteNodeMaterial from "./InstancedSpriteNodeMaterial.js";  
<a name="InstancedSpriteOptions"></a>

## InstancedSpriteOptions : <code>object</code>
InstancedSprite 对象配置项选项

**Kind**: global typedef  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| [show] | <code>boolean</code> | <code>true</code> | 是否显示 |
| [position] | <code>Vector3</code> \| <code>Array.&lt;number&gt;</code> | <code>(0,0,0)</code> | 位置（世界空间） |
| [scale] | <code>number</code> | <code>1</code> | 缩放 |
| [rotation] | <code>number</code> | <code>0</code> | 旋转（弧度） |
| [sizeAttenuation] | <code>boolean</code> | <code>true</code> | 尺寸是否跟随相机深度变化 |
| [center] | <code>Vector2</code> \| <code>Array.&lt;number&gt;</code> | <code>(0.5,0.5)</code> | 锚点中心（0-1） |
| [color] | <code>Color</code> \| <code>number</code> \| <code>string</code> | <code>0xffffff</code> | 颜色 |
| [opacity] | <code>number</code> | <code>1</code> | 不透明度（0-1） |
| [image] | <code>string</code> \| <code>HTMLImageElement</code> \| <code>HTMLCanvasElement</code> |  | 图片资源 |

