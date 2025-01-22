console.log("g.js");

/**
 * Gameオブジェクト
 */
class Game{
    static cnt = 0;
    constructor(dom){
        this.id = Game.cnt++;
        this._trigger = null;
        this.objects = [];
        this.dom = dom;
        this.dom.style.position = "fixed";
        this.active = true;
        this.frame = 0;
        this.score = 0;
    }

    get width(){
        return this.dom.offsetWidth;
    }

    get height(){
        return this.dom.offsetHeight;
    }

    get trigger(){
        return this._trigger;
    }

    set trigger(dom){
        dom.style.backgroundColor = "orange";
        dom.style.color = "black";
        dom.style.cursor = "pointer";
        const self = this;
        dom.addEventListener("click",function(){
            self.start();
            dom.style.display = "none";
        })
        this._trigger = dom;
    }

    append(gameobject){
        gameobject.game = this;
        this.objects.push(gameobject);
        this.dom.appendChild(gameobject.img);
        return this.objects;
    }

    remove(gameobject){
        this.objects = this.objects.filter(e => e.id !== gameobject.id);
    }

    update(){
        const objects = this.objects;
        for(let obj of objects){
            obj.update();
        }
        this.frame += 1;
        if(this.frame > 500){
            this.frame = 0;
        }
    }

    draw(){
        const objects = this.objects;
        for(let obj of objects){
            obj.draw();
        }
    }

    start(){
        const self = this;
        this.draw();
        this.update();
        requestAnimationFrame(function(){
            if(self.active===true){
                self.start();
            }else{
                // self.trigger.style.display = "block";
                return;
            }
        });
    }

    end(){
        console.log("end",parseInt(this.score));
        this.active = false;
    }

}


class GameObject{
    static cnt = 0;
    constructor(){
        this.name = this.constructor.name.toLowerCase();
        this.id = GameObject.cnt++;
        this._img = document.createElement("img");
        this.p = {x:0,y:0};
        this.game = null;
        this.active = true;
        this.status = 0;
        this.speed = 1;
        this.hp = 1;

    }

    get img(){
        return this._img;
    }

    set img(url){
        this.img.src = url;
        this.img.style.position = "fixed";
        this.img.style.opacity = 1;

    }

    move(x,y){
        this.p.x += x;
        this.p.y += y;

        if(this.game.width < this.p.x){
            this.p.x = 0;
        }else if(this.p.x < 0){
            this.p.x = this.game.width;
        }


        if(this.game.height < this.p.y){
            this.p.y = 0;
        }else if(this.p.y < 0){
            this.p.y = this.game.height;
        }
    }

    update(){
        const objects = this.game===null ? [] : this.game.objects;
        for(let gameobject of objects){
            if(this.isColliding(this.img,gameobject.img) === true){
                this.collide(gameobject);
            }
        }
    }

    collide(gameobject){
        // override
    }

    draw(){
        this.img.style.top = `${this.p.y}px`;
        this.img.style.left = `${this.p.x}px`;
    }

    remove(){
        this.img.remove();
        this.game.remove(this);
        delete this;
    }

    // それぞれのGameプラットフォームごとに当たり判定のロジックは変えなければならない
    isColliding(element1, element2) {
        // 自分自身とは衝突しない。
        if (element1 === element2){
            return false;
        }
        
        // 各要素の位置とサイズを取得
        const rect1 = element1.getBoundingClientRect();
        const rect2 = element2.getBoundingClientRect();
    
        // 矩形が重なっているかどうかを判定
        return !(
            rect1.right < rect2.left || // element1がelement2の左側にある
            rect1.left > rect2.right || // element1がelement2の右側にある
            rect1.bottom < rect2.top || // element1がelement2の上側にある
            rect1.top > rect2.bottom    // element1がelement2の下側にある
        );
    }

    isBroken(){
        return this.hp <= 0;
    }


}


class Player extends GameObject{
    static DIRECTION = {
        RIGHT:"ArrowRight",
        LEFT:"ArrowLeft",
        UP:"ArrowUp",
        DOWN:"ArrowDown",
    }

    static INVINCIBILITY_TIME = 200;

    constructor(id){
        super()
        const self = this;
        // PlayerIDを直接指定する場合は上書きする
        if (id !== undefined){ this.id = id; }
        this.hp = 3;
        this.speed = 4;
        this.direction = {x:0,y:0};
        this.frame = 0;

        document.addEventListener("keydown",function(e){
            if(e.key === Player.DIRECTION.RIGHT){
                self.direction.x = 1 * self.speed;
            }else if(e.key === Player.DIRECTION.LEFT){
                self.direction.x = -1 * self.speed;
            }

            if(e.key === Player.DIRECTION.UP){
                self.direction.y = -1 * self.speed;
            }else if(e.key === Player.DIRECTION.DOWN){
                self.direction.y = 1 * self.speed;
            }

        });

        document.addEventListener("keyup",function(e){
            if(e.key === Player.DIRECTION.RIGHT){
                self.direction.x = 0;
            }else if(e.key === Player.DIRECTION.LEFT){
                self.direction.x = 0;
            }

            if(e.key === Player.DIRECTION.UP){
                self.direction.y = 0;
            }else if(e.key === Player.DIRECTION.DOWN){
                self.direction.y = 0;
            }
        })
    }

    update(){
        this.move(this.direction.x,this.direction.y);
        // console.log(this.p.x,this.p.y);
        this.mode(this.status);
        super.update();

        if(this.isBroken()){
            this.game.end();
        }

        this.game.score += 0.01;

    }

    mode(status){
        if(status === 9){
            this.active = false;
            this.invincibility_time();
        }
    }

    invincibility_time(){
        this.frame += 1;
        if(this.frame > Player.INVINCIBILITY_TIME){
            this.img.style.opacity = 1;
            this.status = 0;
            this.frame = 0;
            this.active = true;
            return;
        }

        if(this.img.style.opacity > 1){
            this.img.style.opacity = 0;
        }else{
            this.img.style.opacity = parseFloat(this.img.style.opacity) + 0.2;
        }
    }

    collide(gameobject){
        if(this.active === false){return;}
        console.log(gameobject.name);
    }

}

class Enemy extends GameObject{
    constructor(){
        super();
        this.hp = 1;
        this._player = null;
    }

    update(){
        super.update();

        if(this.isBroken()){
            this.remove();
        }
    }

    collide(gameobject){
        if(this.active === false){return}
        if(gameobject.name === "player" && gameobject.active === true){
            gameobject.hp -= 1;
            gameobject.status = 9;
        }
        this.hp -=1;
    }

    get player(){
        let p = null;
        for(let o of this.game.objects){
            if(o.name === "player"){
                p = o;
            }
        }
        return p;
    }
    
}

class Obstacle extends Enemy{
    constructor(){
        super();
        this.hp = 2;
    }

    update(){
        this.move(0,0);
        super.update();
    }

    collide(gameobject){
        if(this.active === false){return}
        if(gameobject.name === "player" && gameobject.active === true){
            gameobject.hp -= 1;
            gameobject.status = 9;
            this.hp -=1;
        }
    }
}
class Wander extends Enemy{
    constructor(){
        super();
        this.speed = 1
        this.hp = 4;
        this.target = null;
    }

    update(){
        this.move(this.speed,0);
        super.update();
    }

    collide(gameobject){
        if(this.active === false){return}
        if(gameobject.name === "player" && gameobject.active === true){
            gameobject.hp -= 2;
            gameobject.status = 9;
        }
    }
}

class Hunter extends Enemy{
    constructor(){
        super();
        this.speed = 1
        this.hp = 4;
        this.target = null;
    }

    update(){
        if(this.target === null){this.target = this.player;}
        let x = this.p.x - this.player.p.x > 0 ? -1 : 1; 
        let y = this.p.y - this.player.p.y > 0 ? -1 : 1;
        this.move(this.speed * x, this.speed * y);
        super.update();
    }

    collide(gameobject){
        if(this.active === false){return}
        if(gameobject.name === "player" && gameobject.active === true){
            gameobject.hp -= 2;
            gameobject.status = 9;
        }
    }

}



// document.querySelector("#info").dataset.userid
const p = new Player();
p.img = "../static/img/user/heart.svg";

const o = new Obstacle();
o.img = "../static/img/user/star.svg";
o.p.x = 100;
o.p.y = 200;

const w = new Wander();
w.img = "../static/img/user/star.svg";
w.p.x = 300;
w.p.y = 300;

const h = new Hunter();
h.img = "../static/img/user/star.svg";
h.p.x = 200;
h.p.y = 200;

const g = new Game(document.body);
g.trigger = document.querySelector("#start");
g.append(p);
g.append(o);
g.append(w);
g.append(h);