console.log("util.js is called.");

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
        this.parent = document.querySelector(selector);
        this.frame = null;
        // this.id = this.append();
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
        this.frame = DOM.create("div",{class:`fram-${this.type()}`})
        this.frame.appendChild(this.make());
        this.parent.appendChild(this.frame);
        return this.frame;
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
        this.dom = this.make(selector);
        this._objects = {};

        this.draw();

        Grid.list.push(this);
    }

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

    make(selector){
        const self = this;
        const dom = document.querySelector(selector);
        dom.style.margin = "0px";
        dom.style.padding = "0px";
        dom.style.position = "fixed";
        dom.addEventListener("mouseup",function(){
            self.draw();
        })
        return dom;
    }
    
    draw(){
        // 背景の描画
        const dom = this.dom;
        const w = this.w;
        const h = this.h;
        dom.style.backgroundSize = `${w}px ${h}px`;
        dom.style.backgroundPosition = `0% 0%`;
        dom.style.backgroundImage = `repeating-linear-gradient(90deg,#aaa,#aaa 1px,transparent 1px,transparent ${w}px),repeating-linear-gradient(0deg,#aaa,#aaa 1px,transparent 1px,transparent ${h}px)`;
    
        // オブジェクトの描画
        for(let o of this.objects){
            // 座標の調整
            this.fit(o);
            // 描画
            o.draw();
        }
    
    }

    fit(o){
        const w = this.w / Grid.windowRatio.w;
        const h = this.h / Grid.windowRatio.h;
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
                o.w -= o.borderWidth ;
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
    }

    append(id,obj){
        this._objects[id] = obj;
        this.dom.appendChild(obj.pack);
        return this._objects;
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

        // グリッドの再描画
        this.draw();
    }

}

class GridObject{
    static{
        this.cnt = 0;
    }
    constructor(x=50,y=50,z=1,w=100,h=100){
        this.id = `gridobject${GridObject.cnt++}`;
        // 座標情報
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        this.h = h;
        this.ratio = {w:1,h:1};

        this.borderWidth = "3px";
        this.dom = null;
        this.pack = null;

        this.visible = true;
        this.resizable = true;

    }

    make(html=""){
        const pack = document.createElement("div");
        pack.style.position = "fixed";
        pack.style.overflow = "hidden";
        pack.style.border = "solid";
        pack.style.borderWidth = "1px";
        const dom  = document.createElement("div");
        pack.appendChild(dom);
        if(typeof(html) === "string"){
            dom.innerHTML = html;
        }else{
            dom.appendChild(html);
        }
        this.dom  = dom;
        this.pack = pack;
        return dom;
    }

    wrap(selector){
        if(typeof(selector) === "string"){
            // 既存DOMから生成
            this.dom = document.querySelector(selector);
        }else{
            this.dom = selector;
        }
        
        if(this.dom === null){ console.error("セレクタの指定が間違えています。"); }
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
    }

    draw(){
        console.log("draw");
        this.pack.style.display = "inline-block";
        this.pack.style.left   = `${this.left}px`;
        this.pack.style.top    = `${this.top}px`;
        this.pack.style.width  = `${this.width}px`;
        this.pack.style.height = `${this.height}px`;
        // this.pack.style.borderWidth = `${this.borderWidth}px`;

        if(this.visible === false){
            this.pack.style.display = "none";
        }
        return ;
    }

    resize(ratio){
        if(this.resizable === false){return;}
        this.ratio = ratio;
        return ;
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
}

class Sticky{
    static{
        this.cnt = 0;
        this.list = [];
        this.focused = null;
        this.mouseX = 0;
        this.mouseY = 0;
        document.body.addEventListener("mousedown",function(e){
            Sticky.mouseX = e.pageX;
            Sticky.mouseY = e.pageY;
        });
        this.MAX_ZINDEX = 1000;
        this.MIN_ZINDEX = 1;
        
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

    constructor(x=10,y=10,z=10,w=100,h=100){
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

    make(html=""){
        // 仮想DOMから生成
        this.dom = document.createElement("div");
        if (typeof(html) === "string"){
            this.dom.innerHTML = html;
        }else{
            this.dom.appendChild(html);
        }
        this.pickable(this.dom);
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
        dom.setAttribute("contenteditable",true);
        dom.style.height = "100%";
        dom.style.width = "100%";
        const pack = document.createElement("div");
        pack.style.position = "fixed";
        pack.style.overflow = "hidden";
        pack.style.border = "solid";
        pack.style.borderWidth = "3px";
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
            baseL = base.left;   
            baseT = base.top;
            baseW = base.width;
            baseH = base.height;

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
        return this.x * this.ratio.w
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

