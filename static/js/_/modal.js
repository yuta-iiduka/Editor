console.log("modal is called.")

/**
 * TODO
 * modal.css
 * set_yes_btn(){ return this;}
 * set_no_btn(){ return this;}
 * 
 */
class Modal{
    static list = [];
    static cnt = 0;
    static zIndex = 1;

    static large = "large";
    static middle = "middle";
    static small = "small";

    static html(html){
        const dom = document.createElement("div");
        if(typeof(html) === "string"){
            dom.innerHTML = html;
        }else{
            return html;
        }
        return dom;
    }

    static style = new Style(`
            .modal{
                display: block;
                position: fixed;
                height: 0%;
                width: 0%;
                opacity: 0;
                transition: all 0.5s ease-out;
            }
            .modal.active{
                display: block;
                top:10%;
                left:10%;
                height: 80%;
                width: 80%;
                opacity: 1;
            }
            .modal.active .modal_frame{
                display: block;
                position: fixed;
                height: 80%;
                width: 80%;
                border: solid 1px white;
                background-color: #111111;
            }
            .modal.active .modal_background{
                display: block;
                position: fixed;
                top:0%;
                left:0%;
                background-color: black;
                opacity: 0.5;
                height: 100vh;
                width:  100vw;
            }
            .modal_head{
                display: flex;
                justify-content: space-between;
                height: 24px;
            }
            .modal_body{
                height: calc(100% - 48px);
            }
            .modal_foot{
                display: flex;
                height: 24px;
                justify-content: space-between;
                flex-direction: row-reverse;
            }
            .modal_foot_btns{
                display: flex;
                gap: 8px;
            }
            .modal_foot_subbtns{
                display: flex;
                gap: 8px;
            }
            .modal_yes{
                cursor: pointer;
                border: solid 1px white;
            }
            .modal_no{
                cursor: pointer;
                border: solid 1px white;
            }
            .modal_close_btn{
                cursor: pointer;
                background-color: #888888;
            }
    `);

    constructor(size="middle"){
        // Modalの連番を振る
        this.id = Modal.cnt;

        // Modalのサイズ
        this.size = size;
        // Modalが多重で起動した場合の優先順位格納変数
        this.zIndex = 1;

        // ModalのHTMLDOM（実態）を作成
        this.dom = this.create();
        // Bodyに実態を追加
        document.body.appendChild(this.dom);

        // Modalの起動トリガー群
        this.triggers = [];
        this.yes_btn = null;
        this.no_btn = null;
        this.result = null;

        // Modal起動・終了時の処理関数格納用変数
        this._show_event = null; //function
        this._hide_event = null; //function
        
        Modal.list.push(this);
        Modal.cnt++;
    }

    get show_event(){
        return this._show_event;
    }

    set show_event(func){
        if(typeof(func)==="function"){
            this._show_event = func;
        }
    }

    get hide_event(){
        return this._hide_event;
    }

    set hide_event(func){
        if(typeof(func)==="function"){
            this._hide_event = func;
        }
    }

    create(){
        const self = this;
        // ---Modalの基盤
        const modal = document.createElement("div");
        modal.id = `modal${this.id}`;
        modal.classList.add("modal");

        const modal_frame = document.createElement("div");
        modal_frame.id = `modal_frame${this.id}`;
        modal_frame.classList.add("modal_frame",this.size);
        modal.appendChild(modal_frame);
        this.frame = modal_frame;

        // --Modalのヘッダー
        const modal_head = document.createElement("div");
        modal_head.id = `modal_head${this.id}`;
        modal_head.classList.add("modal_head");
        modal_frame.appendChild(modal_head);
        this.head = modal_head;

        // -Modalのタイトル
        const modal_title = document.createElement("div");
        modal_title.id = `modal_title${this.id}`;
        modal_title.classList.add("modal_title");
        modal_head.appendChild(modal_title);
        this.title = modal_title;

        // -Modalのヘッダーメニュー
        const modal_head_menu = document.createElement("div");
        modal_head_menu.id = `modal_head_menu${this.id}`;
        modal_head_menu.classList.add("modal_head_menu");
        modal_head.appendChild(modal_head_menu);
        this.head_menu = modal_head_menu;


        // -Modalの閉じるボタン
        const modal_close_btn = document.createElement("div");
        modal_close_btn.id = `modal_close_btn${this.id}`;
        modal_close_btn.classList.add("modal_close_btn");
        modal_close_btn.textContent = "×";
        modal_close_btn.addEventListener("click",function(){
            self.hide();
        });
        modal_head_menu.appendChild(modal_close_btn);
        this.close_btn = modal_close_btn;


        // --Modalのボディ
        const modal_body = document.createElement("div");
        modal_body.id = `modal_body${this.id}`;
        modal_body.classList.add("modal_body");
        modal_frame.appendChild(modal_body);
        this.body = modal_body;


        // --Modalのフッター
        const modal_foot = document.createElement("div");
        modal_foot.id = `modal_foot${this.id}`;
        modal_foot.classList.add("modal_foot");
        modal_frame.appendChild(modal_foot);
        this.foot = modal_foot;

        // -Modalのフッターボタンエリア
        const modal_foot_btns = document.createElement("div");
        modal_foot_btns.id = `modal_foot_btns${this.id}`;
        modal_foot_btns.classList.add("modal_foot_btns");
        modal_foot.appendChild(modal_foot_btns);
        this.foot_btns = modal_foot_btns;

        // -Modalのフッターボタンエリアサブ
        const modal_foot_subbtns = document.createElement("div");
        modal_foot_subbtns.id = `modal_foot_subbtns${this.id}`;
        modal_foot_subbtns.classList.add("modal_foot_subbtns");
        modal_foot.appendChild(modal_foot_subbtns);
        this.foot_subbtns = modal_foot_subbtns;

        // --Modalの背景（起動時に背景を暗くするため）
        const modal_background = document.createElement("div");
        modal_background.id = `modal_background${this.id}`;
        modal_background.classList.add("modal_background");
        modal_background.addEventListener("click",function(){
            self.hide();
        })
        modal.appendChild(modal_background);
        this.background = modal_background;

        return modal;
    }

    hide(){
        if(typeof(this.hide_event) === "function"){this.hide_event();}
        this.zIndex = 1;
        Modal.zIndex--;
        this.background.style.zIndex = 1;
        this.frame.style.zIndex = 1;
        this.dom.style.zIndex = 1;
        this.dom.classList.remove("active");
        return this;
    }

    show(){
        this.result = null;
        if(typeof(this.show_event) === "function"){this.show_event();}
        this.zIndex = ++Modal.zIndex;
        this.background.style.zIndex = this.zIndex;
        this.frame.style.zIndex = this.zIndex + 1;
        this.dom.style.zIndex = this.zIndex;
        this.dom.classList.add("active");
        return this;
    }

    confirm(){
        return new Promise((resolve)=>{
            this.show();
            this.hide_event = ()=>{
                resolve();
            }
        });
    }

    make_trigger(trigger_id){
        const self = this;
        const trigger = document.querySelector(`#${trigger_id}`);
        if (trigger !== null){
            trigger.addEventListener("click",function(){
                self.show();
            })
        }
        this.triggers.push(trigger);
        return this;
    }

    make_triggers(trigger_class){
        const self = this;
        const triggers = document.querySelector(`.${trigger_class}`);
        if (triggers !== null){
            for(let i=0; i<triggers.length; i++){
                const trigger = triggers[i];
                trigger.addEventListener("click",function(){
                    self.show();
                })
                this.triggers.push(trigger);
            }
        }
        return this;
    }

    set_title(text){
        this.title.textContent = text;
        return this;
    }

    set_head(dom){
        this.head_menu.innerHTML = html;
        return this;
    }
    set_body(html){
        if(typeof(html)==="string"){
            this.body.innerHTML = html;
        }else{
            this.body.innerHTML = "";
            this.body.appendChild(html);
        }
        return this;
    }

    set_foot(html){
        this.foot.innerHTML = html;
        return this;
    }

    add_head(dom){
        this.head_menu.insertBefore(Modal.html(dom),this.head_menu.firstChild);
        return this;
    }
    add_body(html){
        this.body.appendChild(Modal.html(html));
        return this;
    }

    add_foot(html){
        this.foot_subbtns.appendChild(Modal.html(html));
        return this;
    }

    set_yes_btn(func,name="OK"){
        const self = this;
        const yes_btn = document.createElement("div");
        yes_btn.id = `modal_yes${this.id}`;
        yes_btn.classList.add("modal_yes");
        yes_btn.textContent = name;
        yes_btn.addEventListener("click",function(){
            if(typeof(func)==="function"){
                self.result = true;
                if(typeof(func)==="function"){func()};
                self.hide();
            }
        });
        this.yes_btn = yes_btn;
        this.foot_btns.append(Modal.html(yes_btn));
        return this;
    }

    set_no_btn(func,name="キャンセル"){
        const self = this;
        const no_btn = document.createElement("div");
        no_btn.id = `modal_no${this.id}`;
        no_btn.classList.add("modal_no");
        no_btn.textContent = name;
        no_btn.addEventListener("click",function(){
            if(typeof(func)==="function"){
                self.result = false;
                if(typeof(func)==="function"){func()};
                self.hide();
            }
        });
        this.no_btn = no_btn;
        this.foot_btns.append(Modal.html(no_btn));
        return this;
    }

}

class ConfirmModal extends Modal{
    constructor(size=Modal.small){
        super(size);
        this.result = null;
        this.resolve = null;
        this.reject = null;
        this
        .set_title("確認")
        .set_body("")
        .set_yes_btn(()=>{
            this.result = true;
            if(typeof(this.resolve)==="function"){
                this.resolve();
                this.resolve = null;
            }
        })
        .set_no_btn(()=>{
            this.result = false;
            if(typeof(this.resolve)==="function"){
                this.reject(new Error("処理を中断しました"));
                this.reject = null;
            }
        })
    }

    async confirm(message="",func){
        return new Promise((resolve,reject)=>{
            this.resolve = resolve;
            this.reject = reject;
            this.f = func;
            this.set_body(message);
            this.show();    
        }).then(()=>{
            if(typeof(this.f)==="function"){
                this.f();
            }
        });
    }

}

// new Modal()
//     .set_title("Sample")
//     .set_body("<div id='btn'>modal</div>")
//     .make_trigger("xxx1")

// new Modal("small")
//     .set_title("Sample2")
//     .set_body("<div id='btn2'>modal2</div>")
//     .make_trigger("btn")

// new Modal("large")
//     .set_title("Sample3")
//     .set_body("modal3")
//     .make_trigger("btn2")