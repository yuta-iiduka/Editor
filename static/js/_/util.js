console.log("util.js is called.");


class Platform{

    static isMobile(){
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobile = /android|iphone|ipad|ipod|windows phone|mobile/i.test(userAgent);
        return isMobile;
    }

    static isPC(){
        return !this.isMobile();
    }
}
class Style{
    constructor(css=""){
        this.head = document.querySelector("head");
        this.css = css;
        this.dom = document.createElement("style");
        this.build();
        this.head.appendChild(this.dom);
    }

    build(){
        this.dom.innerHTML = this.css;
    }

    update(){
        this.dom.innerHTML = this.css;
    }
}

class DOM {
    static {
        this.counter = {};
        this.dict = {};

        const self = this;
        window.addEventListener("resize",function(){
            const objects_dict = Object.values(self.dict);
            for(let objects of objects_dict){
                const objects_list = Object.values(objects);
                for(let o of objects_list){
                    o.resize();
                }
            }
        })
    }

    /**
     * DOM作成関数
     * @param {*} elm_name 
     * @param {*} option {class:class,id:id}
     * @returns 
     */
    static create(elm_name="div",option={}){
        const elm = document.createElement(elm_name);
        if(option.class){
            elm.classList.add(option.class);
        }
        if(option.id){
            elm.id = option.id;
        }
        return elm;
    }

    /**
     * 複数のNodeを追加する関数
     * @param {*} elm 
     * @param {*} childs 
     * @returns 
     */
    static append(elm,childs=[]){
        for(let c of childs){
            elm.appendChild(c);
        }
        return elm
    }

    constructor(selector){
        if (typeof(selector) === "string" ){
            this.parent = document.querySelector(selector);
        }else{
            this.parent = selector;
        }
        this.frame = null;
        this.contents = null;
    }

    type(){
        return this.constructor.name.toLowerCase();
    }

    append(){
        let id = 0
        const t = this.type()
        if(DOM.dict[t]){
            id = DOM.counter[t];
            DOM.dict[t][id] = this;
            DOM.counter[t]++;
        }else{
            DOM.dict[t] = {};
            DOM.dict[t][0] = this;
            DOM.counter[t] = 0;
            DOM.counter[t]++;
        }
        return id;
    }

    remove(){
        delete DOM.dict[this.type()][this.id];
        DOM.counter[this.type()]--;
    }

    resize(){
        return;
    }

    /**
     * オーバーライド用
     * @returns HTMLElement
     */
    make(){
        const elm = document.createElement("div");
        return elm;
    }

    /**
     * 実際にDOMを画面に追加する関数
     * @returns 
     */
    build(){
        this.frame = DOM.create("div",{class:`frame-${this.type()}`})
        this.contents = this.make();
        this.frame.appendChild(this.contents);
        this.parent.appendChild(this.frame);
        return this.frame;
    }

    get cssClassFrame(){
        return `frame-${this.type()}`;
    }
}

console.log("grid.js is called.")

class Grid{
    static{
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.list = [];
        this.id = 0;
        this.event_resize();
        this.is_pc = Platform.isPC();
        this.is_mobile = Platform.isMobile();
    }

    static event_resize(){
        window.addEventListener("resize",function(){
            for(let g of Grid.list){
                g.resize();
            }
        });
    }

    static get windowRatio(){
        return {
            w: window.innerWidth / this.width ,
            h:  window.innerHeight / this.height,
        }
    }

    constructor(x=64,y=64,selector="body"){
        this.id = Grid.id++;
        this.x = x;
        this.y = y;
        this.baseFontSize = Platform.isPC() ? Grid.width / 100 : Grid.width / 50;
        this.dom = this.make(selector);
        this.fontSize = this.baseFontSize;
        this.fontResize = true;
        this._objects = {};
        this.lineColor = "#444444";
        this.lineSubColor = "#aaaaaa";
        this._width  = this.dom.offsetWidth;
        this._height = this.dom.offsetHeight;

        this.draw();

        Grid.list.push(this);
    }

    /**
     * {x,y,z,w,h,resize,draw}
     */
    get objects(){
        return Object.values(this._objects);
    }

    get objectsID(){
        return Object.keys(this._objects);
    }

    get w(){
        return this.x > 0 ? (Grid.width / this.x) * Grid.windowRatio.w : 0;
    }

    get h(){
        return this.y > 0 ? (Grid.height / this.y) * Grid.windowRatio.h : 0;
    }

    get width(){
        /**
         * Grid全体の横幅
         */
        return this.dom.offsetWidth;
    }

    get height(){
        /**
         * Grid全体の立幅
         */
        return this.dom.offsetHeight;
    }

    get fontSize(){
        return parseFloat(this.dom.style.fontSize.split("px").join(""));
    }

    set fontSize(size){
        this.dom.style.fontSize = `${size}px`;
    }

    get position(){
        /**
         * fixed or absolute
         */
        return this.dom.style.position
    }

    set position(posi){
        /**
         * fixed or absolute
         */
        this.dom.style.position = posi;
    }

    get map(){
        const lst = [];
        for(let r=0; r<this.y; r++){
            lst[r] = [];
            for(let c=0; c<this.x; c++){
                lst[r][c]=[];
            }
        }
        for(let o of this.objects){
            const wid = o.resizable === true ? this.w / Grid.windowRatio.w : this.w;
            const hit = o.resizable === true ? this.h / Grid.windowRatio.h : this.h;
            let x = Math.round(o.x/wid);
            let y = Math.round(o.y/hit);
            let w = Math.round(o.w/wid);
            let h = Math.round(o.h/hit);
            // lst[y][x].push(o);
            for(let r=0; r<h; r++){
                // lst[y+r][x].push(o);
                for(let c=0; c<w; c++){
                    lst[y+r][x+c].push(o);
                }
            }
        }
        return lst;
    }

    cell(r,c){
        let result = null;
        if( r<this.map.length){
            result = this.map[r][c];
        }
    }

    make(selector){
        const self = this;
        const dom = document.querySelector(selector);
        dom.style.margin = "0px";
        dom.style.padding = "0px";
        dom.style.position = "fixed";
        dom.addEventListener("mouseup",function(){
            self.draw();
        });
        return dom;
    }
    
    draw(){
        // 背景の描画
        const dom = this.dom;
        const w = this.w;
        const h = this.h;
        dom.style.backgroundSize = `${w}px ${h}px`;
        dom.style.backgroundPosition = `0% 0%`;
        // dom.style.backgroundImage = `repeating-linear-gradient(90deg,#aaa 0px,#aaa 1px,transparent 1px,transparent ${w}px,red ${w}px,red ${w+1}px,transparent ${w+1}px, transparent ${w*2}px),repeating-linear-gradient(0deg,#aaa,#aaa 1px,transparent 1px,transparent ${h}px)`;
        dom.style.background = `repeating-linear-gradient(90deg,${this.lineSubColor} 0px,${this.lineColor} 1px,transparent 1px,transparent ${w}px,${this.lineColor} ${w}px,${this.lineColor} ${w+1}px,transparent ${w+1}px,transparent ${w*2}px,${this.lineColor} ${w*2}px,${this.lineColor} ${w*2+1}px,transparent ${w*2+1}px,transparent ${w*3}px,${this.lineColor} ${w*3}px,${this.lineColor} ${w*3+1}px,transparent ${w*3+1}px,transparent ${w*4}px,${this.lineColor} ${w*4}px,${this.lineColor} ${w*4+1}px,transparent ${w*4+1}px,transparent ${w*5}px),repeating-linear-gradient(0deg,${this.lineColor},${this.lineColor} 1px,transparent 1px,transparent ${h}px)`;
        
        // オブジェクトの描画
        for(let o of this.objects){
            // 座標の調整
            this.fit(o);
            // 描画
            o.draw();
        }
    
    }

    globalize(){
        this.position = "fixed";
        this.draw();
    }

    localize(){
        this.position = "absolute";
        this.draw();
    }

    fit(o){
        if(o.filtable === false){return;}
        const w = o.resizable === true ? this.w / Grid.windowRatio.w : this.w;
        const h = o.resizable === true ? this.h / Grid.windowRatio.h : this.h;
        if(o.x % w > w / 2){
            o.x = (Math.floor(o.x / w) + 1) * w;
        }else{
            o.x = Math.floor(o.x / w) * w;
        }

        if(o.y % h > h / 2){
            o.y = (Math.floor(o.y / h) + 1) * h;
        }else{
            o.y = Math.floor(o.y / h) * h;
        }

        if(o.w % w > w / 2){
            o.w = (Math.floor(o.w / w) + 1) * w;
            if( 2 * o.borderWidth < w / 2){
                o.w -= o.borderWidth;
            }
        }else{
            o.w = Math.floor(o.w /w) * w;
            if( 2 * o.borderWidth < w / 2){
                o.w -= o.borderWidth;
            }
        }

        if(o.h % h > h / 2){
            o.h = (Math.floor(o.h / h) + 1) * h;
            if( 2 * o.borderWidth < h / 2){
                o.h -= o.borderWidth;
            }
        }else{
            o.h = Math.floor(o.h / h) * h;
            if( 2 * o.borderWidth < h / 2){
                o.h -= o.borderWidth;
            }
        }

        // はみ出した場合の処理
        if(o.x < 0){
            o.x = 0;
        }

        if(o.x + o.width > this.width){
            console.log(o.x , w, this.width);
            o.x = this.width - o.width;
        }

        if(o.y < 0){
            o.y = 0;
        }

        if(o.y + o.height > this.height){
            console.log(o.y , h, this.height);
            o.y = this.height - o.height;
        }

        o.p = {x:Math.round(o.x/w),y:Math.round(o.y/h),z:o.z,w:Math.round(o.w/w),h:Math.round(o.h/h)}
        if(typeof(o.fit) === "function"){
            o.fit(o.p);
        }
    }

    check(obj){
        let message = "";
        if(obj.x === undefined || obj.y === undefined || obj.z === undefined || obj.h === undefined || obj.w === undefined){
            message = "座標指定かサイズ指定が未定義です\n";
        }

        if(typeof(obj.draw) !== "function" || typeof(obj.resize) !== "function"){
            message = "描画関数、リサイズ関数が未定義です\n";
        }

        return message;
    }

    append(id,obj){
        const msg = this.check(obj).length;
        if(msg === 0){
            obj.x = obj.x * this.w;
            obj.y = obj.y * this.h;
            obj.h = obj.h * this.h;
            obj.w = obj.w * this.w;
            this._objects[id] = obj;
            this.dom.appendChild(obj.pack);
        }else{
            console.warn(msg);
        }
        return this._objects;
    }

    move(o,x=1,y=1){
        const w = o.resizable === true ? this.w / Grid.windowRatio.w : this.w;
        const h = o.resizable === true ? this.h / Grid.windowRatio.h : this.h;
        o.move(
            o.x + (w * x),
            o.y + (h * y)
        )
        this.draw();
    }

    size(o,x=1,y=1){
        const w = o.resizable === true ? this.w / Grid.windowRatio.w : this.w;
        const h = o.resizable === true ? this.h / Grid.windowRatio.h : this.h;
        o.size(
            o.w + (w * x),
            o.h + (h * y)
        )
        this.draw();
    }

    remove(id){
        this._objects[id].remove();
        delete this._objects[id];
        return this._objects;
    }

    resize(){
        const ratio = Grid.windowRatio;
        // 各オブジェクトのリサイズ
        for(let o of this.objects){
            o.resize(ratio);
        }

        // フォントサイズを変更
        if(this.fontResize === true){
            this.fontSize = Grid.windowRatio.w * this.baseFontSize;

        }

        // グリッドの再描画
        this.draw();
    }
}

class GridFix extends Grid{
    static defaultW = Grid.width / 32;
    static defaultH = Grid.height / 32;
    constructor(x=64,y=64,w=GridWide.defaultW,h=GridWide.defaultH,selector="body"){
        super(x,y,selector);
        this._x = x;
        this._y = y;
        this._w = w;
        this._h = h;
    }

    append(id,obj){
        obj.resizable = false;
        return super.append(id,obj);
    }

    get w(){
        return this._w;
    }

    get h(){
        return this._h;
    }
}

class GridFixGlobal extends GridFix{
    constructor(x=64,y=64,w=GridWide.defaultW,h=GridWide.defaultH,selector="body"){
        super(x,y,w,h,selector);
        this._x = x;
        this._y = y;
        this._w = w;
        this._h = h;
        this.globalize();
        this.dom.parentElement.style.position = "relative";
    }
}

class GridFixLocal extends GridFix{
    constructor(x=64,y=64,w=GridWide.defaultW,h=GridWide.defaultH,selector="body"){
        super(x,y,w,h,selector);
        this._x = x;
        this._y = y;
        this._w = w;
        this._h = h;
        this.localize();
        this.dom.parentElement.style.position = "relative";
        this.dom.parentElement.style.overflow = "auto";
    }
}

class Block{
    static{
        this.cnt = 0;
        this.list = [];
        // this.focused = null;
        this.mouseX = 0;
        this.mouseY = 0;
        // TODO touch
        document.body.addEventListener("mousedown",function(e){
            Block.mouseX = e.pageX;
            Block.mouseY = e.pageY;
        });
        this.MAX_ZINDEX = 1;
        this.MIN_ZINDEX = 0;
        
    }

    static focus(){
        window.getSelection().removeAllRanges();
        for(let b of Block.list){
            if(b.focused === true){
                b.z = Block.MAX_ZINDEX;
                // b.dom.style.borderColor = "yellow";
                b.pack.style.borderColor = b.storongBorderColor;
            }else{
                b.z = Block.MIN_ZINDEX;
                // b.dom.style.borderColor = b.dom.style.backgroundColor;
                b.pack.style.borderColor = b.baseBorderColor;
            }
        }
    }

    static get focused(){
        return Block.list.filter((b)=>b.focused===true);
    }

    static syncronize_move(blk){
        for(let b of Block.focused){
            if(b !== blk){
                b.move(b.x + blk.gap.x, b.y + blk.gap.y);
                b.draw();
            }
        }
    }

    static syncronize_size(blk){
        for(let b of Block.focused){
            if(b !== blk){
                b.size(b.w + blk.gap.w, b.h + blk.gap.h);
                b.draw();
            }
        }
    }

    static isOverlapping(b1, b2) {
        const rect1 = b1.dom.getBoundingClientRect();
        const rect2 = b2.dom.getBoundingClientRect();
      
        return !(
          rect1.right - 1 < rect2.left ||   // rect1がrect2の左にある
          rect1.left + 1 > rect2.right ||   // rect1がrect2の右にある
          rect1.bottom + 1 < rect2.top ||   // rect1がrect2の上にある
          rect1.top - 1 > rect2.bottom      // rect1がrect2の下にある
        );
    }

    constructor(x=10,y=10,z=1,w=5,h=5){
        this.id = Block.cnt++;
        // 座標情報
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        this.h = h;
        this.ratio = {w:1,h:1};
        this._p = {x:this.x,y:this.y,z:this.z,w:this.w,h:this.h};
        this.gap = {x:0,y:0,z:0,w:0,h:0};
        
        // DOM情報
        this.dom = null;
        this.head = null;
        this.foot = null;
        this.menu = null;
        this.body = null;
        this.frame = null;
        this.pack = null;
        this.style = {
            backgroundColor: "black",
            color: "white",
        };

        this.focused = false;
        this.active = false;
        this.relations = {};

        // 機能の有効化・無効化
        this.movable = false;
        this.resizable = true;
        this.visible = true;
        this.fitable = true;

        this.vertical = true;
        this.horizontal = true;

        this.baseBorderColor = "";
        this.storongBorderColor = "yellow";
        this.baseBackgroundColor = this.style.backgroundColor;
        this.storongBackgroundColor = "red";

        this._contextmenu = function(e){console.log(`${this.id}:contextmenu`)};
        this._dblclick = function(e){console.log(`${this.id}:dblclick`)};
        this._keydown = function(e){console.log(`${this.id}:keydown ${e.key}`)};
        this._fit = (p)=>{
            let lap = false;
            for(let b of Block.list){
                if(b.visible === true && b !== this && b.overlap(this)){
                    this.style.backgroundColor = this.storongBackgroundColor;
                    lap = true;
                }
            }
            if(lap === false){
                this.style.backgroundColor = this.baseBackgroundColor;
            }
        };
        this._collide = function(b){console.log(b);}
        this._resize = null;

        Block.list.push(this);
    }

    get borderWidth(){
        return this.pack ? this.pack.style.borderWidth.split("px").join("") : 0;
    }

    set borderWidth(w){
        if(this.pack){
            this.pack.style.borderWidth = `${w}px`;
        }
    }

    get borderColor(){
        return this.pack ? this.pack.style.borderColor : "";
    }

    set borderColor(c){
        if(this.pack){
            this.pack.style.borderColor = c;
        }
    }

    get name(){
        return this.constructor.name.toLowerCase();
    }

    get p(){
        return this._p;
    }

    set p(positionset){
        this._p = positionset;
        this.dom.dataset.x = positionset.x;
        this.dom.dataset.y = positionset.y;
        this.dom.dataset.z = positionset.z;
        this.dom.dataset.w = positionset.w;
        this.dom.dataset.h = positionset.h;        
    }

    move(x,y){
        this.gap.x = x - this.x;
        this.gap.y = y - this.y;
        if(this.horizontal === true){this.x = x};
        if(this.vertical   === true){this.y = y};
    }

    size(w,h){
        this.gap.w = w - this.w;
        this.gap.h = h - this.h;
        if(this.horizontal === true){this.w = w};
        if(this.vertical   === true){this.h = h};
    }

    make(html="", editable=false){
        // 仮想DOMから生成
        this.dom = document.createElement("div");
        if (typeof(html) === "string"){
            this.dom.innerHTML = html;
        }else{
            this.dom.appendChild(html);
        }
        this.pickable(this.dom,editable);
        this.dom.dataset.x = this.x;
        this.dom.dataset.y = this.y;
        this.dom.dataset.z = this.z;
        this.dom.dataset.h = this.h;
        this.dom.dataset.w = this.w;
        return this;
    }

    wrap(selector, editable=false){
        if(typeof(selector) === "string"){
            // 既存DOMから生成
            this.dom = document.querySelector(selector);
        }else{
            this.dom = selector;
        }
        
        if(this.dom === null){ console.error("セレクタの指定を間違えています。"); }
        const x = this.dom.dataset.x;
        const y = this.dom.dataset.y;
        const z = this.dom.dataset.z;
        const w = this.dom.dataset.w;
        const h = this.dom.dataset.h;

        this.x = x === undefined ? this.x : x;
        this.y = y === undefined ? this.y : y;
        this.z = z === undefined ? this.z : z;
        this.w = w === undefined ? this.w : w;
        this.h = h === undefined ? this.h : h;
        this.pickable(this.dom, editable);
        return this;
    }

    relative(sticky){
        this.relations[sticky.id] = sticky;
        return this;
    }

    unrelative(sticky){
        delete this.relations[sticky.id];
        return this;
    }

    pickable(dom=document.createElement("div"),editable=true){
        const self = this;
        dom.setAttribute("contenteditable",editable);
        dom.style.height = "calc(100% - 2px)";
        dom.style.width = "calc(100% - 2px )";
        dom.style.border = `1px solid ${this.borderColor}`;
        const pack = document.createElement("div");
        pack.style.position = "absolute";
        pack.style.overflow = "hidden";
        pack.style.border = "solid";
        pack.style.borderWidth = "2px";
        pack.style.borderRadius = "4px";
        const frame = document.createElement("div");
        frame.style.overflow = "hidden";
        frame.style.height = "100%";
        frame.style.width  = "100%";
        const head = document.createElement("div");
        head.style.height = "0px";
        head.style.display = "flex";
        head.style.justifyContent = "space-between";

        const foot = document.createElement("div");
        foot.style.height = "0px";
        foot.style.display = "flex";
        foot.style.justifyContent = "space-between";

        const body = document.createElement("div");
        body.style.overflowY = "auto";
        body.style.textWrap = "wrap";
        body.style.overflowWrap = "break-word";
        body.style.height = "100%";

        body.appendChild(dom);
        frame.appendChild(head);
        frame.appendChild(body);
        frame.appendChild(foot);
        pack.appendChild(frame);

        // head
        this.head = head;

        // body
        this.body = body;

        // foot
        this.foot = foot;

        // frame
        this.frame = frame;
        this.pack = pack;

        // TODO PC スマホ版での対応
        this.event();

        return pack;
    }

    event(){
        const self = this;

        // 前処理
        // マウスによる物体の移動
        let baseL = 0;
        let baseT = 0;
        this.frame.addEventListener("mousedown",function(e){
            self.movable = true;
            baseL = self.pack.offsetLeft;
            baseT = self.pack.offsetTop;
        });

        // マウスによるリサイズ
        let is_pack = false;
        let is_frame = false;
        let hold = "";
        let baseW = 0;
        let baseH = 0;
        this.pack.addEventListener("mouseover",function(e){
            is_pack = true;
            // Block.focused = self;
        });

        this.pack.addEventListener("mouseout",function(e){
            is_pack = false;
        });

        this.pack.addEventListener("mousedown",function(e){ 
            if(e.shiftKey === false){
                for(let b of Block.list){
                    b.focused = false;
                }
            } 
            self.focused = true;
            Block.focus();

            const base = self.pack.getClientRects()[0];
            baseL = base.left   - self.borderWidth;   
            baseT = base.top    - self.borderWidth;
            baseW = base.width  - self.borderWidth;
            baseH = base.height - self.borderWidth;

            // リサイズ方向
            if(is_frame === false && is_pack === true){
                const rect = self.frame.getClientRects()[0];
                if(e.pageX <= rect.left){
                    hold = "left";
                }else if( rect.right <= e.pageX){
                    hold = "right";
                }else if(e.pageY <= rect.top){
                    hold = "top";
                }else if( rect.bottom <= e.pageY){
                    hold = "bottom";
                }
            }
        });

        this.frame.addEventListener("mouseover",function(e){
            is_frame = true;
        });
        this.frame.addEventListener("mouseout",function(e){
            is_frame = false;
        });

        // 中処理
        document.body.addEventListener("mousemove",function(e){
            const offset = self.pack.parentElement.getClientRects()[0];
            
            // glovalかlocalで調整
            let offsetL = offset.left;
            let offsetT = offset.top;

            if (self.position === "fixed"){
                offsetL = 0;
                offsetT = 0;
            }

            // カーソル変更
            if(is_frame === false && is_pack === true){
                const rect = self.frame.getClientRects()[0];
                if(e.pageX <= rect.left || rect.right <= e.pageX){
                    self.pack.style.cursor = "ew-resize";
                    
                }
                if( e.pageY <= rect.top || rect.bottom <= e.pageY){
                    self.pack.style.cursor = "ns-resize";
                }
            }else{
                self.pack.style.cursor = "auto";
            }

            // リサイズ
            if(hold === "right"){
                self.size(
                    (e.pageX - Block.mouseX + baseW) / self.ratio.w,
                    self.h,
                );
                self.resize_event(self.ratio);
                self.draw();
                window.getSelection().removeAllRanges();
                Block.syncronize_size(self);

            }else if(hold === "left"){
                self.move(
                    (e.pageX - offsetL - Block.mouseX + baseL) / self.ratio.w,
                    self.y
                )
                self.size(
                    (-e.pageX + Block.mouseX + baseW) / self.ratio.w,
                    self.h,
                );
                self.resize_event(self.ratio);
                self.draw();
                window.getSelection().removeAllRanges();
                Block.syncronize_move(self);
                Block.syncronize_size(self);

            }else if(hold === "top"){
                self.move(
                    self.x,
                    (e.pageY - offsetT - Block.mouseY + baseT) / self.ratio.h,
                )
                self.size(
                    self.w,
                    (-e.pageY + Block.mouseY + baseH) / self.ratio.h,
                );
                self.resize_event(self.ratio);
                self.draw();
                window.getSelection().removeAllRanges();
                Block.syncronize_move(self);
                Block.syncronize_size(self);

            }else if(hold === "bottom"){
                self.size(
                    self.w,
                    (e.pageY - Block.mouseY + baseH) / self.ratio.h,
                );
                self.resize_event(self.ratio);
                self.draw();
                window.getSelection().removeAllRanges();
                Block.syncronize_size(self);

            }


            // 位置変更
            if(self.movable){
                self.move(
                    (e.pageX - offsetL - (Block.mouseX - baseL)) / self.ratio.w,
                    (e.pageY - offsetT  - (Block.mouseY - baseT)) / self.ratio.h
                );
                self.draw();
                window.getSelection().removeAllRanges();
                Block.syncronize_move(self);
            }

            // 重なり判定
            let lap = false;
            for(let b of Block.list){
                if(b.visible === true && b !== self && b.overlap(self)){
                    self.style.backgroundColor = self.storongBackgroundColor;
                    lap = true;
                }
            }
            if(lap === false){
                self.style.backgroundColor = self.baseBackgroundColor;
            }

        });
        
        // 後処理
        document.addEventListener("mouseup",function(e){
            self.movable = false;
            hold = "";
        });

        // コンテキストメニュー
        this.pack.addEventListener("contextmenu",function(e){
            e.preventDefault();
            self._contextmenu(e);
        });

        // ダブルクリック
        this.pack.addEventListener("dblclick",function(e){
            self._dblclick(e);
        });

        // キー入力イベント
        this.pack.addEventListener("keydown",function(e){
            if(e.ctrlKey === true & e.shiftKey === true){
                e.preventDefault();
                self._keydown(e);
            }
        });

    }

    remove(){
        this.pack.remove();
    }

    draw(){
        const ratio = this.ratio;
        this.pack.style.display = "inline-block";
        this.pack.style.zIndex = `${this.z}`;
        this.pack.style.left   = `${this.left}px`;
        this.pack.style.top    = `${this.top}px`;
        this.pack.style.width  = `${this.width}px`;
        this.pack.style.height = `${this.height}px`;
        this.pack.style.borderWidth = `${this.borderWidth}px`;
        this.frame = this.decorate(this.frame);

        if(this.visible === false){
            this.pack.style.display = "none";
        }
        return this.pack;
    }

    resize(ratio){
        if(this.resizable === false){return;}
        this.ratio = ratio;
    }

    decorate(frame){
        for(const prop in this.style){
            frame.style[prop] = this.style[prop];
        }
        return frame;
    }

    show(){
        this.visible = true;
        return this.draw();
    }

    hide(){
        this.visible = false;
        return this.draw();
    }

    overlap(b){
        let result = false;
        if(this.visible === true && b.visible === true){
            result = Block.isOverlapping(this,b);
            if(result){
                new Promise((resolve)=>{this.collide(b);resolve();});
            }
        }
        return result 
    }

    editable(){
        this.dom.setAttribute("contenteditable",true);
        return this.draw();
    }

    uneditable(){
        this.dom.setAttribute("contenteditable",false);
        return this.draw();
    }

    get left(){
        return this.x * this.ratio.w;
    }

    get top(){
        return this.y * this.ratio.h;
    }

    get right(){
        return (this.x + this.w) * this.ratio.w;
    }

    get bottom(){
        return (this.y + this.h) * this.ratio.h; 
    }

    get width(){
        return this.w * this.ratio.w;
    }

    get height(){
        return this.h * this.ratio.h;
    }

    get message(){
        return this.messages.innerHTML;
    }

    set message(html){
        if(typeof(html) === "string"){
            this.messages.innerHTML = html;
        }else{
            this.messages.appendChild(html);
        }
    }

    get name(){
        return this.title.innerHTML
    }

    set name(html){
        if(typeof(html) === "string"){
            this.title.innerHTML = html;
        }else{
            this.title.appendChild(html);
        }
    }

    get position(){
        return this.pack.style.position;
    }

    set position(posi){
        return this.pack.style.position = posi;
    }

    get contextmenu(){
        return this._contextmenu;
    }

    glovalize(){
        this.position = "fixed";
    }

    localize(){
        this.position = "absolute";
    }

    set contextmenu(func){
        if(typeof(func) === "function"){
            this._contextmenu = func;
        }
    }

    get dblclick(){
        return this._dblclick;
    }

    set dblclick(func){
        if(typeof(func) === "function"){
            this._dblclick = func;
        }
    }

    get keydown(){
        return this._keydown;
    }

    set keydown(func){
        if(typeof(func) === "function"){
            this._keydown = func;
        }
    }

    get fit(){
        return this._fit;
    }

    set fit(func){
        if(typeof(func) === "function"){
            this._fit = func;
        }
    }

    get collide(){
        return this._collide;
    }

    set collide(func){
        if(typeof(func) === "function"){
            this._collide = func;
        }
    }

    get resize_event(){
        return this._resize === null ? function(){return} : this._resize;
    }

    set resize_event(func){
        if(typeof(func) === "function"){
            this._resize = func;
        }
    }
}

/**
 * TODO:Touch機能にも対応できるようにする
 */
class Sticky{
    static{
        this.cnt = 0;
        this.list = [];
        this.focused = null;
        this.mouseX = 0;
        this.mouseY = 0;
        // TODO touch
        document.body.addEventListener("mousedown",function(e){
            Sticky.mouseX = e.pageX;
            Sticky.mouseY = e.pageY;
        });
        this.MAX_ZINDEX = 1;
        this.MIN_ZINDEX = 0;
        
        this.canvas = this.canv();
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        
    }

    static canv(){
        const canvas = document.createElement("canvas");
        document.body.appendChild(canvas);
        canvas.style.height = "100%";
        canvas.style.width = "100%";
        canvas.style.position = "fixed";
        canvas.style.left = "0px";
        canvas.style.top  = "0px";
        canvas.style.pointerEvents = "none";
        // TODO touch
        window.addEventListener("resize",function(){
            canvas.width = Sticky.canvas.offsetWidth;
            canvas.height = Sticky.canvas.offsetHeight;
            Sticky.redraw();
        });
        return canvas;
    }

    static redraw(){

        Sticky.refresh();
        // オブジェクトごとに描画
        for(let s of Sticky.list){
            Sticky.draw(s);
        }
    }

    static refresh(){
        // 描写の初期化
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    }

    static draw(sticky){

        // 紐づけの描写
        for(let rid of Object.keys(sticky.relations)){
            this.draw_relation_line(sticky, sticky.relations[rid]);
        }
    }

    static draw_relation_line(sticky1,sticky2){
        if(sticky1.pack.style.display === "none" || sticky2.pack.style.display === "none"){return}
        this.ctx.beginPath();
        this.ctx.moveTo(sticky1.pack.offsetLeft,sticky1.pack.offsetTop);
        this.ctx.lineTo(sticky2.pack.offsetLeft,sticky2.pack.offsetTop);
        this.ctx.strokeStyle = "orange";
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

    }

    static focus(){
        for(let s of Sticky.list){
            if(s.focused === true){
                s.z = Sticky.MAX_ZINDEX;
            }else{
                s.z = Sticky.MIN_ZINDEX;
            }
        }
    }

    static theme(style){
        Dom.style(`${style}`);
    }

    constructor(x=10,y=10,z=1,w=5,h=5){
        this.id = Sticky.cnt++;
        // 座標情報
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        this.h = h;
        this.ratio = {w:1,h:1};
        
        // DOM情報
        this.dom = null;
        this.head = null;
        this.foot = null;
        this.menu = null;
        this.body = null;
        this.frame = null;
        this.pack = null;
        this.style = {
            backgroundColor: "black",
            color: "white",
        };

        this.focused = false;
        this.active = false;
        this.relations = {};

        // 機能の有効化・無効化
        this.movable = false;
        this.resizable = true;
        this.visible = true;

        this._contextmenu = function(e){console.log(`${this.id}:contextmenu`)};
        this._dblclick = function(e){console.log(`${this.id}:dblclick`)};
        this._keydown = function(e){console.log(`${this.id}:keydown ${e.key}`)};
        this._resize = null;

        Sticky.list.push(this);
        console.log(Sticky.list);
    }

    get borderWidth(){
        return this.pack ? this.pack.style.borderWidth.split("px").join("") : 0;
    }

    set borderWidth(w){
        if(this.pack){
            this.pack.style.borderWidth = `${w}px`;
        }
    }

    get borderColor(){
        return this.pack ? this.pack.style.borderColor : "";
    }

    set borderColor(c){
        if(this.pack){
            this.pack.style.borderColor = c;
        }
    }

    get name(){
        return this.constructor.name.toLowerCase();
    }

    move(x,y){
        this.x = x;
        this.y = y;
    }

    size(w,h){
        this.w = w;
        this.h = h;
    }

    make(html="",editable=true){
        // 仮想DOMから生成
        this.dom = document.createElement("div");
        if (typeof(html) === "string"){
            this.dom.innerHTML = html;
        }else{
            this.dom.appendChild(html);
        }
        this.pickable(this.dom,editable);
        this.dom.dataset.x = this.x;
        this.dom.dataset.y = this.y;
        this.dom.dataset.z = this.z;
        this.dom.dataset.h = this.h;
        this.dom.dataset.w = this.w;
        return this;
    }

    wrap(selector, editable=true){
        if(typeof(selector) === "string"){
            // 既存DOMから生成
            this.dom = document.querySelector(selector);
        }else{
            this.dom = selector;
        }
        
        if(this.dom === null){ console.error("セレクタの指定を間違えています。"); }
        const x = this.dom.dataset.x;
        const y = this.dom.dataset.y;
        const z = this.dom.dataset.z;
        const w = this.dom.dataset.w;
        const h = this.dom.dataset.h;

        this.x = x === undefined ? this.x : x;
        this.y = y === undefined ? this.y : y;
        this.z = z === undefined ? this.z : z;
        this.w = w === undefined ? this.w : w;
        this.h = h === undefined ? this.h : h;
        this.pickable(this.dom, editable);
        return this;
    }

    relative(sticky){
        this.relations[sticky.id] = sticky;
        return this;
    }

    unrelative(sticky){
        delete this.relations[sticky.id];
        return this;
    }

    pickable(dom=document.createElement("div"),editable=true){
        const self = this;
        dom.setAttribute("contenteditable",editable);
        dom.style.height = "100%";
        dom.style.width = "100%";
        const pack = document.createElement("div");
        pack.style.position = "fixed";
        pack.style.overflow = "hidden";
        pack.style.border = "solid";
        pack.style.borderWidth = "2px";
        pack.style.borderRadius = "4px";
        const frame = document.createElement("div");
        frame.style.overflow = "hidden";
        frame.style.height = "100%";
        frame.style.width  = "100%";
        const head = document.createElement("div");
        head.style.height = "24px";
        head.style.display = "flex";
        head.style.justifyContent = "space-between";
        const title = document.createElement("div");
        title.innerHTML = "title";
        const menu = document.createElement("div");
        const hide_btn = document.createElement("span");
        hide_btn.textContent = "×";
        hide_btn.style.cursor = "pointer";
        hide_btn.addEventListener("click",function(){
            self.hide();
        });
        
        const settings = document.createElement("span");
        settings.textContent = "■";
        settings.style.cursor = "pointer";
        const edit_btn = document.createElement("span");
        edit_btn.textContent = "〇";
        edit_btn.dataset.edit = "〇";
        edit_btn.dataset.unedit = "●";
        edit_btn.style.cursor = "pointer";
        edit_btn.addEventListener("click",function(){
            const is_edit = self.dom.getAttribute("contenteditable");
            if(JSON.parse(is_edit) === true){
                self.dom.setAttribute("contenteditable",false);
                edit_btn.textContent = edit_btn.dataset.unedit;
            }else{
                self.dom.setAttribute("contenteditable",true);
                edit_btn.textContent = edit_btn.dataset.edit;
            }
        });

        if(editable === true){
            menu.appendChild(edit_btn);
        }

        menu.appendChild(settings);
        menu.appendChild(hide_btn);

        const sub = document.createElement("div");
        sub.style.height = "24px";
        sub.style.display = "flex";
        sub.style.justifyContent = "flex-end";
        const sub_btns = document.createElement("div");
        sub.appendChild(sub_btns);
        head.appendChild(title);
        head.appendChild(menu);
        const foot = document.createElement("div");
        foot.style.height = "24px";
        foot.style.display = "flex";
        foot.style.justifyContent = "space-between";
        const messages = document.createElement("div");
        messages.style.fontSize = "x-small";
        messages.textContent = "foot";
        const controllers = document.createElement("div");
        controllers.style.width = "70%";
        foot.appendChild(messages);
        foot.appendChild(controllers);

        const body = document.createElement("div");
        body.style.overflowY = "auto";
        body.style.textWrap = "wrap";
        body.style.overflowWrap = "break-word";
        body.style.height = "calc( 100% - 72px)";

        body.appendChild(dom);
        frame.appendChild(head);
        frame.appendChild(sub);
        frame.appendChild(body);
        frame.appendChild(foot);
        pack.appendChild(frame);

        // head
        this.head = head;
        this.title = title;
        this.settings = settings;
        this.hide_btn = hide_btn;

        // body
        this.body = body;

        // foot
        this.foot = foot;
        this.messages = messages;
        this.controllers = controllers;

        // frame
        this.frame = frame;
        this.pack = pack;

        // TODO PC スマホ版での対応
        this.event();

        return pack;
    }

    event(){
        const self = this;

        // 前処理
        // マウスによる物体の移動
        let baseL = 0;
        let baseT = 0;
        this.head.addEventListener("mousedown",function(e){
            self.movable = true;
            baseL = self.pack.offsetLeft;
            baseT = self.pack.offsetTop;
        });

        // マウスによるリサイズ
        let is_pack = false;
        let is_frame = false;
        let hold = "";
        let baseW = 0;
        let baseH = 0;
        this.pack.addEventListener("mouseover",function(e){
            is_pack = true;
            Sticky.focused = self;
        });
        this.pack.addEventListener("mouseout",function(e){
            is_pack = false;
        });
        this.pack.addEventListener("mousedown",function(e){

            for(let s of Sticky.list){
                s.focused = false;
            }
            self.focused = true;

            Sticky.focus();

            const base = self.pack.getClientRects()[0];
            baseL = base.left - self.borderWidth;   
            baseT = base.top - self.borderWidth;
            baseW = base.width - self.borderWidth;
            baseH = base.height - self.borderWidth;

            // リサイズ方向
            if(is_frame === false && is_pack === true){
                const rect = self.frame.getClientRects()[0];
                if(e.pageX <= rect.left){
                    hold = "left";
                }else if( rect.right <= e.pageX){
                    hold = "right";
                }else if(e.pageY <= rect.top){
                    hold = "top";
                }else if( rect.bottom <= e.pageY){
                    hold = "bottom";
                }
            }
        });

        this.frame.addEventListener("mouseover",function(e){
            is_frame = true;
        });
        this.frame.addEventListener("mouseout",function(e){
            is_frame = false;
        });

        // 中処理
        document.body.addEventListener("mousemove",function(e){
            // カーソル変更
            if(is_frame === false && is_pack === true){
                const rect = self.frame.getClientRects()[0];
                if(e.pageX <= rect.left || rect.right <= e.pageX){
                    self.pack.style.cursor = "ew-resize";
                    
                }
                if( e.pageY <= rect.top || rect.bottom <= e.pageY){
                    self.pack.style.cursor = "ns-resize";
                }
            }else{
                self.pack.style.cursor = "auto";
            }

            // リサイズ
            if(hold === "right"){
                self.size(
                    (e.pageX - Sticky.mouseX + baseW) / self.ratio.w,
                    self.h,
                );
                self.resize_event(self.ratio);
                self.draw();
                window.getSelection().removeAllRanges();
            }else if(hold === "left"){
                self.move(
                    (e.pageX - Sticky.mouseX + baseL) / self.ratio.w,
                    self.y
                )
                self.size(
                    (-e.pageX + Sticky.mouseX + baseW) / self.ratio.w,
                    self.h,
                );
                self.resize_event(self.ratio);
                self.draw();
                window.getSelection().removeAllRanges();
            }else if(hold === "top"){
                self.move(
                    self.x,
                    (e.pageY - Sticky.mouseY + baseT) / self.ratio.h,
                )
                self.size(
                    self.w,
                    (-e.pageY + Sticky.mouseY + baseH) / self.ratio.h,
                );
                self.resize_event(self.ratio);
                self.draw();
                window.getSelection().removeAllRanges();
            }else if(hold === "bottom"){
                self.size(
                    self.w,
                    (e.pageY - Sticky.mouseY + baseH) / self.ratio.h,
                );
                self.resize_event(self.ratio);
                self.draw();
                window.getSelection().removeAllRanges();
            }


            // 位置変更
            if(self.movable){
                self.move(
                    (e.pageX - (Sticky.mouseX - baseL)) / self.ratio.w,
                    (e.pageY - (Sticky.mouseY - baseT)) / self.ratio.h
                );
                self.draw();
                window.getSelection().removeAllRanges();
            }

            Sticky.redraw();

        });
        
        // 後処理
        document.addEventListener("mouseup",function(e){
            self.movable = false;
            hold = "";
        });

        // コンテキストメニュー
        this.pack.addEventListener("contextmenu",function(e){
            e.preventDefault();
            self._contextmenu(e);
        });

        // ダブルクリック
        this.pack.addEventListener("dblclick",function(e){
            self._dblclick(e);
        });

        // キー入力イベント
        this.pack.addEventListener("keydown",function(e){
            if(e.ctrlKey === true & e.shiftKey === true){
                e.preventDefault();
                self._keydown(e);
            }
        });

    }

    remove(){
        this.pack.remove();
    }

    draw(){
        const ratio = this.ratio;
        this.pack.style.display = "inline-block";
        this.pack.style.zIndex = `${this.z}`;
        this.pack.style.left   = `${this.left}px`;
        this.pack.style.top    = `${this.top}px`;
        this.pack.style.width  = `${this.width}px`;
        this.pack.style.height = `${this.height}px`;
        this.pack.style.borderWidth = `${this.borderWidth}px`;
        this.frame = this.decorate(this.frame);

        if(this.visible === false){
            this.pack.style.display = "none";
        }
        return this.pack;
    }

    resize(ratio){
        if(this.resizable === false){return;}
        this.ratio = ratio;
    }

    decorate(frame){
        for(const prop in this.style){
            frame.style[prop] = this.style[prop];
        }
        return frame;
    }

    show(){
        this.visible = true;
        return this.draw();
    }

    hide(){
        this.visible = false;
        return this.draw();
    }

    editable(){
        this.dom.setAttribute("contenteditable",true);
        return this.draw();
    }

    uneditable(){
        this.dom.setAttribute("contenteditable",false);
        return this.draw();
    }

    get left(){
        return this.x * this.ratio.w;
    }

    get top(){
        return this.y * this.ratio.h;
    }

    get right(){
        return (this.x + this.w) * this.ratio.w;
    }

    get bottom(){
        return (this.y + this.h) * this.ratio.h; 
    }

    get width(){
        return this.w * this.ratio.w;
    }

    get height(){
        return this.h * this.ratio.h;
    }

    get message(){
        return this.messages.innerHTML;
    }

    set message(html){
        if(typeof(html) === "string"){
            this.messages.innerHTML = html;
        }else{
            this.messages.appendChild(html);
        }
    }

    get name(){
        return this.title.innerHTML
    }

    set name(html){
        if(typeof(html) === "string"){
            this.title.innerHTML = html;
        }else{
            this.title.appendChild(html);
        }
    }

    get contextmenu(){
        return this._contextmenu;
    }

    set contextmenu(func){
        if(typeof(func) === "function"){
            this._contextmenu = func;
        }
    }

    get dblclick(){
        return this._dblclick;
    }

    set dblclick(func){
        if(typeof(func) === "function"){
            this._dblclick = func;
        }
    }

    get keydown(){
        return this._keydown;
    }

    set keydown(func){
        if(typeof(func) === "function"){
            this._keydown = func;
        }
    }

    get resize_event(){
        return this._resize === null ? function(){return} : this._resize;
    }

    set resize_event(func){
        if(typeof(func) === "function"){
            this._resize = func;
        }
    }
}

console.log("filter.js is called.")

class Filter{
    static{
        this.cnt = 0;
        this.list = [];
        this.WORD = {OR:"OR",AND:"AND",DUMMYID:"_dummy_id"};
        this.COMPARISION = {
            EQUAL:"equal",NOT_EQUAL:"not_equal",
            BIGGER:"bigger",SMALLER:"smaller",
            EQUAL_BIGGER:"equal_bigger",EQUAL_SMALLER:"equal_smaller",
            BEFORE:"before",AFTER:"after",
            EQUAL_BEFORE:"equal_before",EQUAL_AFTER:"equal_after",
            INCLUDE:"include",NOT_INCLUDE:"not_include",
        };
        this.COMPARISION_NAME = {
            EQUAL:"等しい",NOT_EQUAL:"等しくない",
            BIGGER:"大なり",SMALLER:"小なり",
            EQUAL_BIGGER:"以上",EQUAL_SMALLER:"以下",
            BEFORE:"よりも前",AFTER:"よりも後",
            EQUAL_BEFORE:"以前",EQUAL_AFTER:"以後",
            INCLUDE:"含む",NOT_INCLUDE:"含まない",
        };

        this.COMPARISIONLIST = {
            datetime:[{comparision:"equal",name:"等しい"},{comparision:"not_equal",name:"等しくない"},{comparision:"before",name:"以前"},{comparision:"after",name:"以後"}],
            str:[{comparision:"equal",name:"等しい"},{comparision:"not_equal",name:"等しくない"},{comparision:"include",name:"含む"},{comparision:"not_include",name:"含まない"}],
            int:[{comparision:"equal",name:"等しい"},{comparision:"not_equal",name:"等しくない"},{comparision:"equal_bigger",name:"以上"},{comparision:"equal_smaller",name:"以下"}],
        };

    }

    /**
     * 条件に合わせてフィルターを行う
     * condition[or[and]];
     * condition = [
     *      [
     *          {field:"id",value:1,comparision:"==="},
     *          {field:"name",value:"your name",comparision:"in"}
     *      ],
     *      [
     *          {field:"id",value:2,comparision:">"},
     *          {field:"name",value:"him name",comparision:"==="} 
     *      ]
     * ];
     * @param {Array} condition 
     */
    constructor(condition=[],data=null){

        this.condition  = null;
        this.set_condition(condition);

        // 元データリスト
        this.data = null;
        this.diff = null;
        this.set(data);
        // フィルターした結果のリストデータ
        this.result = [];

    }

    set(data){
        delete this.data;
        this.data = data;
        if(data){
            for(let i=0; i<this.data.length; i++){
                this.data[i][Filter.WORD.DUMMYID] = i;
            }
        }
        return this;
    }

    set_condition(condition){
        delete this.condition;
        this.condition = condition;
        return this;
    }

    /**
     * single filter
     * @returns 
     */
    check(list=[],field="",value=null,comparision=Filter.COMPARISION.EQUAL){
        const result = list.filter(function(data){
            const d = data[field];
            if(d === undefined){ return false;}
            if( Filter.COMPARISION.EQUAL == comparision){
                return d == value;
            }else if(Filter.COMPARISION.NOT_EQUAL == comparision){
                return d != value;
            }else if(Filter.COMPARISION.BIGGER === comparision){
                return parseFloat(d) > parseFloat(value);
            }else if(Filter.COMPARISION.SMALLER === comparision){
                return parseFloat(d) < parseFloat(value);
            }else if(Filter.COMPARISION.EQUAL_BIGGER === comparision){
                return parseFloat(d) >= parseFloat(value);
            }else if(Filter.COMPARISION.EQUAL_SMALLER === comparision){
                return parseFloat(d) <= parseFloat(value);
            }else if(Filter.COMPARISION.BEFORE === comparision){
                return new Date(d) < new Date(value);
            }else if(Filter.COMPARISION.AFTER === comparision){
                return new Date(d) > new Date(value);
            }else if(Filter.COMPARISION.EQUAL_BEFORE === comparision){
                return new Date(d) <= new Date(value);
            }else if(Filter.COMPARISION.EQUAL_AFTER === comparision){
                return new Date(d) >= new Date(value);
            }else if(Filter.COMPARISION.INCLUDE === comparision){
                return d.includes(value);
            }else if(Filter.COMPARISION.NOT_INCLUDE === comparision){
                return !(d.includes(value));
            }
        });
        return result;
    }

    or(or_condition){
        let result = [];
        for(let con of or_condition){
            result = result.concat(this.and(con));
        }
        return result;
    }

    and(and_condition){
        let result = this.data;
        for(let con of and_condition){
            result = this.check(result, con.field, con.value, con.comparision);
        }
        return result;
    }

    all(){
        if(this.result !== undefined && this.result !== null){
            return this.result;        
        }
        return [];
    }

    one(){
        return this.get(0);
    }

    get(index=0){
        if(this.result !== undefined && this.result !== null && this.result.length>0){
            return this.result[index] === undefined ? null : this.result[index];
        }
        return null;
    }

    map(list=[]){
        return Array.from( new Map( list.map((r) => [r[Filter.WORD.DUMMYID], r]) ).values() );
    }

    take_diff(){
        const self = this;
        return [...this.data].filter(function(d){
            let flag = true;
            for(let r of self.result){
                // console.log(d,r);
                // console.log(JSON.stringify(d) === JSON.stringify(r));
                if(JSON.stringify(d) === JSON.stringify(r)){
                    flag = false;
                }
            }
            return flag;
        });
    }

    build(){
        const result = this.or(this.condition);
        this.result = this.map(result);
        this.diff = this.take_diff();
        return this;
    }
}

class Sort{
    constructor(condition=[],data=null){
        this.condition = condition;
        this.data = data;
        this.result = [];
    }

    set_condition(condition){
        delete this.condition;
        this.condition = condition;
        return this;
    }

    check(list=[],field="",type="str",desc=-1){
        const result = list.sort(function(a,b){
            let val = null;
            if(type === "str"){
                val = a[field].localeCompare(b[field]) * desc;
            }else if(type === "int"){
                val = a[field] * desc - b[field] * desc; 
            }else if(type === "datetime"){
                val = new Date(a[field]) > new Date(b[field]) ? desc : -1 * desc;
            }
            return val;
        })

        return result;
    }

    build(){
        if(this.condition){
            const field = this.condition.field;
            const type = this.condition.type;
            const desc = this.condition.desc;
            this.result = this.check(this.data,field,type,desc);
        }
    }
}


class Pagination{
    constructor(condition=[],data=null){
        this.condition = condition;
        this.data = data;
        this.result = [];
    }

    check(perPage=10,dataLength=-1){
        const result = []
        if(this.data){
            const len = dataLength === -1 ? this.data.length : dataLength;
            let page_data = [];
            for(let i=0; i<len; i++){
                if( i % perPage === 0 && i !== 0){
                    result.push(page_data);
                    page_data = [];
                }
                page_data.push(this.data[i]);
                
            }
            result.push(page_data)
        }
        return result;
    }

    build(){
        if(this.condition){
            const perPage = this.condition.perPage
            const dataLength = this.condition.dataLength
            if(dataLength){
                this.result = this.check(perPage,dataLength);
            }else{
                this.result = this.check(perPage);
            }
        }
    }
}

class SideMenu extends DOM {

    static list = [];
    static MODE = {LEFT:"left",RIGHT:"right"};
    static CONST = {TO_RIGHT:"&#9655",TO_LEFT:"&#9665"};

    constructor(selector="body",mode=SideMenu.MODE.LEFT){
        super(selector);
        this.mode = mode;
        this.css = this.style();
        this.btn_op = null;
        this.btn_cl = null;
        
        SideMenu.list.push(this);
    }

    style(){
        return SideMenu.list.length > 0 ? null : new Style(`
            .${this.cssClassFrame}{
                height: 100%;
                width: 100%;
                position: absolute;
                left: 0px;
                top: 0px;
                pointer-events:none;
            }

            .sidemenu-contents{
                display:flex;
                width: 50%;
                height: 100%;
                width: 16px;
                text-wrap: nowrap;
                over-flow: hidden;
                transition: width 0.5s, left 0.5s;
                position: absolute;
                left: 0px;
                pointer-events: all;

            }

            .sidemenu-contents.left{
                flex-direction:row-reverse;
            }
            .sidemenu-contents.right{
                flex-direction:row;
                left:calc(100% - 16px)
            }

            .sidemenu-contents.active{
                width: calc(50% + 16px);
            }

            .sidemenu-contents.right.active{
                left: calc(50% - 16px);
            }

            .btnbar{
                background-color: #333333;
                width: 16px;
                height: 100%;
                display:flex;
                justify-content: center;
                align-items: center;
                cursor: pointer;
            }

            .btnop{
                background-color: #333333;
                cursor: pointer;
                height: 16px;
                width: 16px;
                display:flex;
                justify-content: center;
                align-items: center;
            }

            .btnop.disable{
                display:none;
            }

            .btncl{
                background-color: #333333;
                cursor: pointer;
                height: 16px;
                width: 16px;
                display:flex;
                justify-content: center;
                align-items: center;
            }

            .btncl.disable{
                display:none;
            }

            .contents{
                display:flex;
                flex-direction:column;
                background-color: #222222;
                height: 100%;
                width: calc(100% - 16px);
                overflow-x: hidden;
                
            }
        `);
    }


    make(){
        const elm = super.make();
        elm.classList.add("sidemenu-contents");
        elm.classList.add(this.mode);
        const op = this.mode === SideMenu.MODE.LEFT ? SideMenu.CONST.TO_RIGHT : SideMenu.CONST.TO_LEFT;
        const cl = this.mode === SideMenu.MODE.LEFT ? SideMenu.CONST.TO_LEFT  : SideMenu.CONST.TO_RIGHT;
        const btnbar = DOM.create("div",{class:"btnbar"});
        this.btn_op = DOM.create("div",{class:"btnop"});
        this.btn_op.innerHTML = op;
        this.btn_cl = DOM.create("div",{class:"btncl"});
        this.btn_cl.classList.add("disable");
        this.btn_cl.innerHTML = cl;
        btnbar.appendChild(this.btn_op);
        btnbar.appendChild(this.btn_cl);
        this.main = DOM.create("div",{class:"contents"});
        elm.appendChild(btnbar);
        elm.appendChild(this.main);

        const self = this;
        const disable = "disable";
        let mode = "close";
        // this.btn_op.addEventListener("click",function(){
        //     self.btn_op.classList.add(disable);
        //     self.btn_cl.classList.remove(disable);
        //     elm.classList.add("active");
        //     mode = "open";
        // });
        // this.btn_cl.addEventListener("click",function(){
        //     self.btn_op.classList.remove(disable);
        //     self.btn_cl.classList.add(disable);
        //     elm.classList.remove("active");
        //     mode = "close";
        // });
        btnbar.addEventListener("click",function(){
            if(mode === "close"){
                self.btn_op.classList.add(disable);
                self.btn_cl.classList.remove(disable);
                elm.classList.add("active");
                mode = "open";
            }else{
                self.btn_op.classList.remove(disable);
                self.btn_cl.classList.add(disable);
                elm.classList.remove("active");
                mode = "close";
            }
        })

        return elm
    }

    build(dom){
        super.build();
        if(this.css !== null && this.css !== undefined){
            this.css.build();
        }
        if(dom !== null && dom !== undefined){
            this.main.appendChild(dom);
        }
        return this.frame;
    }

    append(dom){
        this.main.appendChild(dom);
    }


}

class TabPage extends DOM{

    static list = [];

    constructor(selector){
        super(selector);
        this.data = {};     //初期データ
        this.pages = {};    //実際の画面DOMデータ
        this.css = this.style();
        TabPage.list.push(this);
    }

    style(){
        return new Style(`
            .tab-btn{
                background-color: black;
            }
            .tab-btn.active{
                background-color: grey;
            }
        `);
    }

    turn_page(index=0){
        const pagenames = Object.keys(this.pages);
        if(typeof(index)==="string"){
            for(let pagename of pagenames){
                if(index === pagename){
                    this.pages[pagename].style.display = "inline-block";
                }else{
                    this.pages[pagename].style.display = "none";
                }
            }
        }else{
            for(let i=0; i<pagenames.length; i++){
                const pagename = pagenames[i];
                if(index === i){
                    this.pages[pagename].style.display = "inline-block";
                }else{
                    this.pages[pagename].style.display = "none";
                }
            }
        }
    }

    make(){
        const self = this;
        const elm = super.make();
        const tab_frame = document.createElement("div");
        tab_frame.style.height = "24px";
        tab_frame.style.display = "flex";
        tab_frame.style.justifyContent = "start";
        const main_frame = document.createElement("div");
        main_frame.style.height = "calc(100% - 24px)";
        elm.appendChild(tab_frame);
        elm.appendChild(main_frame);
        elm.style.display = "flex";
        elm.style.flexDirection = "column";
        elm.style.height = "100%";

        const pagenames = Object.keys(this.data);
        let p = 0;
        for(let pagename of pagenames){
            const tab_btn = DOM.create("div",{class:"tab-btn"});
            tab_btn.textContent = pagename;
            tab_btn.addEventListener("click",function(){
                self.turn_page(tab_btn.textContent);
                for(let btn of document.querySelectorAll(".tab-btn")){
                    btn.classList.remove("active");
                }
                tab_btn.classList.add("active");
            });
            const tab = document.createElement("div");
            const content = this.data[pagename];
            if(typeof(content) === "string"){
                tab.innerHTML = content;
            }else{
                tab.appendChild(content);
            }
            tab.style.display = "none";
            tab.classList.add(`tab${p}`);
            this.pages[pagename] = tab;
            tab_frame.appendChild(tab_btn);
            main_frame.appendChild(tab);
            p += 1;
        }
        return elm;
    }

    build(){
        super.build();
        this.css.build();
    }
}

class Scheduler{
    static cnt = 0;
    static list = [];

    constructor(selector="body"){
        this.dom = document.querySelector(selector);
        this.grid = new GridFixLocal(1440,64,8,64,selector);
        this.data = [];
        this.page = [];
        this.active_page = 0;

        Scheduler.list.push(this);
    }

    get map(){
        const m = this.grid.map;
        const n = [];
        for(let r=0; r<m.length; r++){
            n[r] = [];
            for(let c=0; c<m[r].length; c++){
                n[r][c] = [];
                for(let o=0; o<m[r][c].length; o++){
                    if(m[r][c][o].visible === true){
                        n[r][c].push(m[r][c][o]);
                    }
                }
            }
        }
        return n;
    }

    make(html){
        const b = new Block(1,1,1,10,1).make(html);
        this.grid.append(b.id,b);
        this.data.push(b);
        return this
    }

    wrap(selector){
        const b = new Block(1,1,1,10,1).wrap(selector);
        this.grid.append(b.id,b);
        this.data.push(b);
        return this
    }

    filterable(){
        this.filter_obj = new Filter();
        return this;
    }

    sortable(){
        this.sort_obj = new Sort();
        return this;
    }

    pagenatable(condition={perPage:2,dataLength:this.data.length}){
        const p = new Pagination(condition,this.data);
        p.build();
        this.page = p.result;
        return this;
    }

    turn_page(index=0){
        this.active_page = index;
        this.draw();
    }

    draw(){
        for(let i=0; i<this.page.length; i++){
            for(let o of this.page[i]){
                if(i === this.active_page){
                    o.visible = true;
                }else{
                    o.visible = false;
                }
            }
        }
        this.grid.draw();
    }

    build(){
        this.pagenatable();
        this.draw();
        return this;
    }

}

class DateTime{

    /**
     * 時間区間の重なりをチェックする関数
     * @param {Date | number} start1 - 最初の区間の開始時刻（Dateオブジェクトまたはタイムスタンプ）
     * @param {Date | number} end1   - 最初の区間の終了時刻
     * @param {Date | number} start2 - 比較する区間の開始時刻
     * @param {Date | number} end2   - 比較する区間の終了時刻
     * @returns {boolean} - 区間が重なっている場合は true
     */
    static isOverlapping(start1, end1, start2, end2) {
        start1 = typeof(start1) === "string" ? new Date(start1) : start1 
        start2 = typeof(start2) === "string" ? new Date(start2) : start2 
        end1 = typeof(end1) === "string" ? new Date(end1) : end1 
        end2 = typeof(end2) === "string" ? new Date(end2) : end2 

        return (start1 < end2 && start2 < end1);
    }
}

// let f = new Filter();
//     f.set_condition(
//         [
//             [{field:"id", value:4, comparision:Filter.COMPARISION.BIGGER},{field:"name", value:"e", comparision:Filter.COMPARISION.EQUAL}],
//             [{field:"name", value:"a", comparision:Filter.COMPARISION.EQUAL}],
//             [{field:"name", value:"a", comparision:Filter.COMPARISION.EQUAL}],
//         ]
//     )
//     .set([
//         {id:1,name:"a"},
//         {id:2,name:"b"},
//         {id:3,name:"c"},
//         {id:4,name:"d"},
//         {id:5,name:"e"},
//         {id:6,name:"f"},
//         {id:7,name:"g"},
//         {id:1,name:"a"},
//     ])
//     .build();

// console.log(f.all());

// new DOM();
// new DOM();

