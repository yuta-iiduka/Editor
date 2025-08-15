console.log("canvas.js is called.");

class Canvas{
    static cnt = 0;
    static list = [];
    static active_canvas = null;
    static COLOR = {
        None:"none", BLACK:"black", WHITE:"white", ORANGE:"orange",
    }
    static SIZE = {
        XLARGE:"100", LARGE:"80", NORMAL:"60", HALF:"50", SMALL:"40", XSMALL:"20", NONE: "0",
    }
    static PER = {
        PERCENT:"%", PIXEL:"px", VW:"vw", VH:"vh"
    };
    static window = { width: window.innerWidth, height: window.innerHeight};
    static mouse = {x:16, y:16};

    static{
        window.addEventListener("resize",function(e){
            const cl = Canvas.list;
            for(let c of cl){
                c.resize(window.innerWidth / Canvas.window.width, window.innerHeight / Canvas.window.height);
                for(let o of Object.values(c.objects)){
                    o.resize(window.innerWidth / Canvas.window.width, window.innerHeight / Canvas.window.height);
                }
            }
        });
        document.addEventListener("mouseup",function(){
            const cl = Canvas.list;
            for(let c of cl){
                for(let o of c.list){
                    o.draw();
                }
            }
        })
    }

    constructor(selector,wrap=false){
        this.id = Canvas.cnt++;
        this.parent = wrap===false ? document.querySelector(selector) : null;
        this.dom = wrap===false ? this.build() : this.wrap(document.querySelector(selector));
        this.ctx = this.dom.getContext("2d");
        this.color = Canvas.COLOR.BLACK;
        this._backgroundColor = Canvas.COLOR.ORANGE; //Canvas.COLOR.None;
        this.per = Canvas.PER.PERCENT;
        this.height = `${Canvas.SIZE.XLARGE}`;
        this.width = `${Canvas.SIZE.XLARGE}`;
        this.img_data = null;
        this.mouseX = Canvas.mouse.x;
        this.mouseY = Canvas.mouse.y;
        this.objects = {};
        this.list = [];
        this.adjust();

        Canvas.list.push(this);
    }

    style(option={}){
        if(this.dom === undefined || this.dom === null){ return;}

        for(let o of Object.keys(option)){
            this.dom.style[o] = option[o];
        }
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

    get name(){
        return this.constructor.name.toLowerCase();
    }

    /**
     * CANVASをラップ
     */
    wrap(dom){
        dom.id = `${this.name}${this.id}`;
        dom.classList.add("canvas");
        this.init(dom);
        return dom;
    }

    /**
     * CANVASタグの返却
     * @returns 
     */
    build(){
        const dom  = document.createElement("canvas");
        dom.id = `${this.name}${this.id}`;
        dom.classList.add("canvas");
        this.parent.appendChild(dom);
        this.init(dom);
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

    append(obj){
        obj.canvas = this;
        this.objects[obj.id] = obj;
        this.list.push(obj);
        return this.sort(this.list);
    }

    remove(obj){
        delete this.objects[obj.id];
        this.list = this.list.filter(o => o.id === obj.id);
        return this.sort(this.list);
    }

    sort(){
        this.list = this.list.sort((a,b) => b.z - a.z);
        return this.list;
    }

    draw(){
        for(let o of this.list){
            o.draw();
        }
    }

    init(dom=this.dom){
        const self = this;
        dom.addEventListener("click",function(e){
            for(let o of self.list){
                console.log(o.isMouseOver(e));
                if(o.isMouseOver(e)){
                    typeof(o.click) === "function" ? o.click(e) : null;
                    break;
                }
            }
        });
        dom.addEventListener("contextmenu",function(e){
            console.log(e.offsetX,e.offsetY);
            for(let o of self.list){
                console.log(o.isMouseOver(e));
                if(o.isMouseOver(e)){
                    typeof(o.contextmenu) === "function" ? o.contextmenu(e) : null;
                    break;
                }
            }
        });
        dom.addEventListener("mousemove",function(e){
            for(let o of self.list){
                if(o.isMouseOver(e)){
                    typeof(o.mousemove) === "function" ? o.mousemove(e) : null;
                    o.is_focused = true;
                    break;
                }else{
                    if(o.is_focused === true){
                        o.is_focused = false;
                        typeof(o.mouseout) === "function" ? o.mouseout(e) : null;
                        break;
                    }
                }
            }        
        });
        dom.addEventListener("mouseout",function(e){
            for(let o of self.list){
                o.is_focused = false;
                typeof(o.mouseout) === "function" ? o.mouseout(e) : null;
            }
        });
        return dom;
    }

}

class CanvasObject{
    static cnt = 0;

    static isCollide(o1,o2){
        if(o1 === o2 || o1.is_active === false || o2.is_active === false){ return false;}
        return !(
            o1.right < o2.left || // o1がo2の左側にある
            o1.left > o2.right || // o1がo2の右側にある
            o1.bottom < o2.top || // o1がo2の上側にある
            o1.top > o2.bottom    // o1がo2の下側にある
        )
    }

    constructor(x=0,y=0,z=0,w=0,h=0,option={}){
        this.id = CanvasObject.cnt++;
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        this.h = h;
        this.option = option;
        this.canvas = null;
        this.is_resize  = true;
        this.is_active  = true;
        this.is_visible = true;
        this.is_focused = false;
    }

    get left(){
        return this.x;
    }

    get right(){
        return this.x + this.w;
    }

    get top(){
        return this.y;
    }

    get bottom(){
        return this.y + this.h;
    }

    draw(){
        if(this.is_visible === false){ return; }
        this.canvas.ctx.beginPath();
        this.canvas.fillStyle = "black";
        this.canvas.ctx.fillRect(this.x,this.y,this.w,this.h);
        // this.canvas.ctx.strokeRect();

    }

    resize(ratioW,ratioH){
        if(this.is_resize === false){ return; }
        this.x = this.x * ratioW;
        this.y = this.y * ratioH;
        this.draw();
    }

    isCollide(obj){
        if(this === obj || this.is_active === false || obj.is_active === false){ return false;}
        return !(
            this.right < obj.left || // thisがobjの左側にある
            this.left > obj.right || // thisがobjの右側にある
            this.bottom < obj.top || // thisがobjの上側にある
            this.top > obj.bottom    // thisがobjの下側にある
        )
    }

    isMouseOver(e){
        if(this.is_active === false){ return false;}
        const mouseX = this.canvas ? this.canvas.mouseX : 16;
        const mouseY = this.canvas ? this.canvas.mouseY : 16;
        return !(
            this.right < e.offsetX || // thisがobjの左側にある
            this.left > e.offsetX + mouseX   || // thisがobjの右側にある
            this.bottom < e.offsetY + mouseY || // thisがobjの上側にある
            this.top > e.offsetY                // thisがobjの下側にある
        );
    }

    click(e){
        console.log("clicked", e.offsetX, e.offsetY);
    }

    contextmenu(e){
        console.log("contextmenu", e.offsetX, e.offsetY);
    }

    mousemove(e){
        console.log("mousemoved", e.offsetX, e.offsetY);
    }

    mouseout(e){
        console.log("mouseout", e.offsetX, e.offsetY);
    }

}

class CanvasMouse extends CanvasObject{
    constructor(x=0,y=0,z=0,w=0,h=0,option={}){
        super(x,y,z,w,h,option);
    }

    draw(){
        this.canvas.ctx.beginPath();
        this.canvas.ctx.arc()
    }
}

// class Overlay extends Canvas{
//     constructor(selector,option={opacity:0.5}){
//         super(selector);
//         this.dom.style.pointerEvents = "none";
//         this.style(option);
//     }
// }

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

