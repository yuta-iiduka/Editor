
// const g = new GridFixLocal(1440,64,8,64,"#sample");
// const b = new Block(1,1,2,1,2).make("BLOCK");
// b.draw();
// g.append(b.id,b);
// g.draw();

const scheduler = new Scheduler("#sample");
scheduler.make("1")
scheduler.make("2")
scheduler.make("3")
scheduler.make("4")
scheduler.make("5")

async function init_scheduler(){
    let pro = new Promise((resolve)=>{console.log("start");resolve();})
    for(let i = 0; i<30; i++){
        scheduler.active_data = i;
        pro = new Promise((resolve)=>{
            for(let d = 0; d<120; d++){
                const b = scheduler.item(`data ${i}:${d} block`,{x:i,y:d,z:1,w:1,h:1});
                b.sizableX = false;
            }
            resolve();
        });
    }
}

const sm = new SideMenu("body",SideMenu.MODE.RIGHT); //b.dom,SideMenu.MODE.RIGHT
sm.build(document.createTextNode("xxx"));

const tp = new TabPage(sm.main);
tp.data["aaa"] = "a";
tp.data["bbb"] = "b";

tp.build();
tp.turn_page(0);


const modal = new Modal()
    .set_title("Sample")
    .set_body("<div id='btn'>modal</div>")
    .set_yes_btn(function(){
        console.log("yes");
    },"OK")

async function confirm_modal(){
        console.log("confirm start.");
        await modal.confirm();
        console.log(modal.result);
        console.log("confirm end.");
}

init_scheduler();
scheduler.build()