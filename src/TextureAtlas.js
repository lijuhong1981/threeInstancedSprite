import { CanvasTexture } from "three";

/**
 * 纹理图集，将多张图片按行（shelf）打包进一张 Canvas 纹理，用于合并 draw call
 */
class TextureAtlas {
    /**
     * @param {object} [options]
     * @param {number} [options.initialSize=1024] 初始边长（正方形，单位像素）
     * @param {number} [options.maxSize=8192] 最大边长，自动扩容到该值后不再增大
     * @param {number} [options.padding=2] 子图间距，防止线性过滤时边缘渗色
    */
    constructor(options = {}) {
        this.initialSize = options.initialSize || 1024;
        this.maxSize = options.maxSize || 8192;
        this.padding = options.padding !== undefined ? options.padding : 2;

        this.size = this.initialSize;
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        this.ctx = this.canvas.getContext('2d');

        this.texture = new CanvasTexture(this.canvas);
        this.texture.needsUpdate = true;

        this._cursorX = this.padding;
        this._cursorY = this.padding;
        this._rowHeight = 0;
        this._rects = new Map(); // source -> {x, y, w, h} 像素矩形
    }
    /**
     * 将图片加入图集，返回其像素矩形；已加入过则返回缓存；图集整体已满则返回null
     * @param {HTMLImageElement|HTMLCanvasElement} source
     * @returns {{x:number,y:number,w:number,h:number}|null}
    */
    add(source) {
        const cached = this._rects.get(source);
        if (cached) return cached;

        const w = source.width;
        const h = source.height;
        const stepW = w + this.padding * 2;
        const stepH = h + this.padding * 2;

        // 单张图片超过当前图集尺寸时，先扩容到能容纳
        while (stepW > this.size || stepH > this.size) {
            if (!this.grow()) {
                throw new Error('TextureAtlas: 图片尺寸超过图集最大尺寸');
            }
        }

        // 当前行放不下则换行
        if (this._cursorX + stepW > this.size) {
            this._cursorX = this.padding;
            this._cursorY += this._rowHeight;
            this._rowHeight = 0;
        }
        // 图集整体已满
        if (this._cursorY + stepH > this.size) {
            return null;
        }

        const x = this._cursorX + this.padding;
        const y = this._cursorY + this.padding;
        const rect = { x, y, w, h };
        this._rects.set(source, rect);

        this.ctx.drawImage(source, x, y, w, h);

        this._cursorX += stepW;
        this._rowHeight = Math.max(this._rowHeight, stepH);

        this.texture.needsUpdate = true;
        return rect;
    }
    /**
     * 获取图片已分配的像素矩形
     * @param {HTMLImageElement|HTMLCanvasElement} source
     * @returns {{x:number,y:number,w:number,h:number}|undefined}
    */
    getRect(source) {
        return this._rects.get(source);
    }
    /**
     * 扩容图集（边长翻倍），成功返回true；已达最大尺寸返回false
     * @returns {boolean}
    */
    grow() {
        const newSize = this.size * 2;
        if (newSize > this.maxSize) return false;

        const newCanvas = document.createElement('canvas');
        newCanvas.width = newSize;
        newCanvas.height = newSize;
        const newCtx = newCanvas.getContext('2d');
        newCtx.drawImage(this.canvas, 0, 0);

        this.canvas = newCanvas;
        this.ctx = newCtx;
        this.size = newSize;
        this.texture.image = this.canvas;
        this.texture.needsUpdate = true;
        return true;
    }
    /**
     * 将像素矩形转为归一化 UV（uOffset, vOffset, uScale, vScale）
     * @param {{x:number,y:number,w:number,h:number}} rect
     * @returns {Array<number>}
    */
    getUvRect(rect) {
        return [
            rect.x / this.size,
            1 - (rect.y + rect.h) / this.size, // flipY=true 时纹理上下翻转，v 坐标需反转
            rect.w / this.size,
            rect.h / this.size,
        ];
    }
}

export default TextureAtlas;
export { TextureAtlas };
