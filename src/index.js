/**
 * Created by hxstudio on 2019/10/8.
 */

function ScratchCard(config) {
  // 默认配置
  this.config = {
    // canvas元素
    canvas: null,
    // 直接全部刮开的百分比
    showAllPercent: 55,
    // 图片图层
    coverImg: null,
    // 纯色图层，如果图片图层值不为null，则纯色图层无效
    coverColor: '#FFC900',
    // 全部刮开回调
    doneCallback: null,
    // 擦除半径
    radius: 20,
    // 屏幕倍数
    pixelRatio: 1,
    // 展现全部的淡出效果时间（ms）
    fadeOut: 1000
  };

  // merge 配置参数
  Object.assign(this.config, config);

  this.canvas = this.config.canvas;
  this.ctx = null;
  this.offsetX = null;
  this.offsetY = null;

  this._init();
}

ScratchCard.prototype = {
  constructor: ScratchCard,

  _init: function () {
    var that = this;
    this.ctx = this.canvas.getContext('2d');
    this.offsetX = this.canvas.offsetLeft;
    this.offsetY = this.canvas.offsetTop;

    this._addEvent();

    if (this.config.coverImg) {
      // 如果设置了图片涂层
      var coverImg = new Image();
      coverImg.src = this.config.coverImg;
      coverImg.onload = function () {
        that.ctx.drawImage(coverImg, 0, 0);
        that.ctx.globalCompositeOperation = 'destination-out';
      }
    } else {
      // 如果没有设置图片涂层，则使用纯层
      this.ctx.fillStyle = this.config.coverColor;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      that.ctx.globalCompositeOperation = 'destination-out';
    }
  },

  _addEvent: function () {
    this.canvas.addEventListener('touchstart', this._eventDown.bind(this), {passive: false});
    this.canvas.addEventListener('touchend', this._eventUp.bind(this), {passive: false});
    this.canvas.addEventListener('touchmove', this._scratch.bind(this), {passive: false});
    this.canvas.addEventListener('mousedown', this._eventDown.bind(this), {passive: false});
    this.canvas.addEventListener('mouseup', this._eventUp.bind(this), {passive: false});
    this.canvas.addEventListener('mousemove', this._scratch.bind(this), {passive: false});
  },

  _eventDown: function (e) {
    e.preventDefault();
    this.isDown = true;
  },

  _eventUp: function (e) {
    e.preventDefault();
    this.isDown = false;
  },

  _scratch: function (e) {
    e.preventDefault();
    var that = this;

    if (!this.done && this.isDown) {

      // 如果有多个触点，取最后一个
      if (e.changedTouches) {
        e = e.changedTouches[e.changedTouches.length - 1];
      }

      // 计算触点在canvas里的相对坐标
      var x = (e.clientX + document.body.scrollLeft || e.pageX) - this.offsetX || 0;
      var y = (e.clientY + document.body.scrollTop || e.pageY) - this.offsetY || 0;

      // 开始刮开，绘制透明图层
      this.ctx.beginPath();
      this.ctx.arc(x * that.config.pixelRatio, y * that.config.pixelRatio, that.config.radius * that.config.pixelRatio, 0, Math.PI * 2);
      this.ctx.fill();

      // 判断是否刮开全部涂层
      if (this._getFilledPercentage() > this.config.showAllPercent) {
        this._scratchAll();
      }
    }
  },

  // 刮开全部涂层
  _scratchAll: function () {
    var that = this;
    this.done = true;

    if (this.config.fadeOut > 0) {
      // 渐隐效果，先在样式上清除，再用canvas清除
      this.canvas.style.transition = 'all ' + this.config.fadeOut / 1000 + 's linear';
      this.canvas.style.opacity = '0';

      setTimeout(function () {
        that._clear();
      }, that.config.fadeOut);
    } else {
      that._clear();
    }

    this.config.doneCallback && this.config.doneCallback();
  },

  // 获取已刮开的涂层区域百分比
  _getFilledPercentage: function () {
    var imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

    // 当前canvas画布的全部像素点信息
    var pixels = imgData.data;

    // 当前canvas画布上，透明像素点信息
    var transPixels = [];

    // 利用canvas的getImageData()方法可以获取到全部的像素点信息，返回数组格式。
    // 数组中，并不是每个元素代表一个像素的信息，而是每4个元素为一个像素的信息。例如：
    // data[0] = 像素1的R值，红色（0-255）
    // data[1] = 像素1的G值，绿色（0-255）
    // data[2] = 像素1的B值，蓝色（0-255）
    // data[3] = 像素1的A值，alpha 通道（0-255; 0 透明，255完全可见）
    // data[4] = 像素2的R值，红色（0-255）

    for(var i = 0; i < pixels.length; i += 4){
      // 取像素点的透明度，透明度小于 255 的一半时，则认为是透明的
      if(pixels[i + 3] < 128){
        transPixels.push(pixels[i + 3]);
      }
    }

    // 计算 透明的像素点 的占比
    return (transPixels.length / (pixels.length / 4) * 100).toFixed(2);
  },

  // 清除全部涂层
  _clear: function () {
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

}

// 阻止页面的滚动
window.addEventListener('touchmove', function (e) {
  e.preventDefault();
}, {passive: false});


new ScratchCard({
  canvas: document.getElementById('canvas'),
  coverImg: '../img/scratch-2x.png',
  pixelRatio: 1,
  doneCallback: function () {
    console.log('done')
  }
});