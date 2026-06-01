# InstancedSprite

three自带的Sprite并不支持GPU Instancing，当遇到需要在场景中大量展示标签的情况时就会出现帧率下降的问题，所以开发了这个InstancedSprite，以InstancedBufferGeometry+自定义ShaderMaterial的形式实现了Sprite的GPU Instancing，极大的提高了大批量标签展示时的渲染效率。

## 安装

```bash
npm install @lijuhong1981/instancedsprite
```

## 使用

```js
import { InstancedSpriteCollection } from "@lijuhong1981/instancedsprite";
...
// 初始化
const collection = new InstancedSpriteCollection();
...
// 动画帧更新
const onAnimate = () => {
    window.requestAnimationFrame(onAnimate);
    ...
    collection.update();
};
// 添加
const sprite = collection.add(
    {
        position: [100, 100, 100], //位置
        rotation: 0, //旋转
        scale: 1.0, //缩放
        sizeAttenuation: false, //尺寸跟随相机深度变化
        center: [0.5, 0], //中心锚点
        color: 0xff0000, //颜色
        opacity: 0.5, //不透明度
        image: './res/icon.png', //图像地址，相同的image会分配到同一个Mesh下一次性渲染
    }
);
// 移除
sprite.remove();
// 或
// collection.remove(sprite);
// 清空
collection.clear();
```

## [API文档](./API.md)
