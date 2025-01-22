console.log("canvas.js is called.");

class Canvas{
    static cnt = 0;
    static list = [];
    static active_canvas = null;
    static COLOR = {
        BLACK:"black", WHITE:"white", ORANGE:"orange",
    }
    static SIZE = {
        XLARGE:"100", LARGE:"80", NORMAL:"60", HALF:"50", SMALL:"40", XSMALL:"20", NONE: "0",
    }
    static PER = {
        PERCENT:"%", PIXEL:"px", VW:"vw", VH:"vh"
    };
    static window = { width: window.innerWidth, height: window.innerHeight}

    static{
        window.addEventListener("resize",function(){
            const cl = Canvas.list;
            for(let c of cl){
                c.resize(window.innerWidth / Canvas.window.width, window.innerHeight / Canvas.window.height);
            }
        });
    }

    constructor(selector){
        this.parent = document.querySelector(selector);
        this.id = Canvas.cnt++;

        this.dom = this.build();
        this.ctx = this.dom.getContext("2d");

        this.color = Canvas.COLOR.BLACK;
        this.backgroundColor = Canvas.COLOR.ORANGE;
        this.per = Canvas.PER.PERCENT;
        this.height = `${Canvas.SIZE.XLARGE}`;
        this.width = `${Canvas.SIZE.XLARGE}`;

        this.img_data = null;

        this.adjust();

        Canvas.list.push(this);
    }

    get color(){
        return this._color;
    }

    set color(c){
        this._color = c;
        this.dom.style.color = this._color;
    }

    get backgroundColor(){
        return this._backgroundColor;
    }

    set backgroundColor(c){
        this._backgroundColor = c;
        this.dom.style.backgroundColor = this._backgroundColor;
    }

    get per(){
        return this._per === undefined || this._per === null ? this._per : "";
    }

    set per(p){
        this._per = p;
    }

    get height(){
        return this._height;
    }

    set height(h){
        this._height = `${h}${this.per}`;
        this.dom.style.height = this._height;
    }

    get width(){
        return this._width;
    }

    set width(w){
        this._width = `${w}${this.per}`;
        this.dom.style.width = this._width;
    }


    /**
     * CANVASタグの返却
     * @returns 
     */
    build(){
        const dom  = document.createElement("canvas");
        dom.id = `canvas${this.id}`;
        dom.classList.add("canvas");
        this.parent.appendChild(dom);
        
        return dom;
    }

    adjust(){
        const dom = this.dom;
        dom.style.backgroundColor = this.backgroundColor;
        dom.style.color = this.color;
        dom.style.margin = "0px";
        dom.style.padding = "0px";
        // dom.style.height = this.height;
        // dom.style.width = this.width;

        dom.width  = dom.offsetWidth;
        dom.height = dom.offsetHeight;
        if(this.img_data !== null){
            this.ctx.putImageData(this.img_data,0,0);
        }
        
    }

    /**
     * 画像情報文字列を返却もしくは、それを含めたIMGタグを返却
     * @param {Boolean} is_img 
     * @returns 
     */
    convert(is_img=false){
        const data_url = this.dom.toDataURL();
        if(is_img){
            return data_url;
        }else{
            const img = document.createElement("img");
            img.src = data_url;
            return img
        }
    }

    resize(ratioW,ratioH){
        this.width  = this.width  * ratioW;
        this.height = this.height * ratioH;
        this.adjust();
        
    }

    save(){
        const w = this.dom.width  > Canvas.window.width  ? this.dom.width  : Canvas.window.width;
        const h = this.dom.height > Canvas.window.height ? this.dom.height : Canvas.window.height;
        this.img_data = this.ctx.getImageData(0, 0, w, h);
    }

}


/**
 * リサイズにより画面外になってしまうと描画データが消えてしまう。
 * 固定値のサイズに変更すればOKか？
 */
class Doodle extends Canvas{


    constructor(selector){
        super(selector);
        this.is_drawing = false;
        this.is_active  = true;
    }

    build(){
        const canvas = super.build();
        const self = this;
        canvas.addEventListener("pointerdown" ,function(e){
            if(self.is_active === false){return;}
            e.preventDefault();self.draw_start(e);
        });
        canvas.addEventListener("pointermove" ,function(e){
            if(self.is_active === false){return;}
            e.preventDefault();self.drawing(e);
        });
        canvas.addEventListener("pointerup"   ,function(e){
            if(self.is_active === false){return;}
            e.preventDefault();self.draw_end(e);
        });
        //ペンタブの挙動を調整するため他のイベントを無効にする
        canvas.addEventListener("pointercancel",function(e){e.preventDefault();});
        canvas.addEventListener("touchstart",function(e){e.preventDefault();});
        canvas.addEventListener("touchmove",function(e){e.preventDefault();});
        canvas.addEventListener("touchend",function(e){e.preventDefault();});
        canvas.addEventListener("touchcancel",function(e){e.preventDefault();});

        return canvas;
    }


    draw_start(event){
        // console.log("draw_start",event.pressure);
        this.is_drawing = true;
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = event.pressure * 10;
        // this.ctx.moveTo(event.clientX  - this.dom.offsetLeft, event.clientY  - this.dom.offsetTop);
        this.ctx.moveTo(event.offsetX , event.offsetY);
    }

    drawing(event){
        if(this.is_drawing === false ){return;}
        // console.log(event.pressure,event.tangentialPressure,event.layerX,);
        this.ctx.lineWidth = event.pressure * 10;
        // this.ctx.lineTo(event.clientX - this.dom.offsetLeft, event.clientY - this.dom.offsetTop);
        this.ctx.lineTo(event.offsetX, event.offsetY);
        this.ctx.stroke();
        
    }

    draw_end(event){
        this.is_drawing = false;
        this.save();
        // const w = this.dom.width  > Doodle.window.width  ? this.dom.width  : Doodle.window.width;
        // const h = this.dom.height > Doodle.window.height ? this.dom.height : Doodle.window.height;
        // this.img_data = this.ctx.getImageData(0, 0, w, h);
    }

}

