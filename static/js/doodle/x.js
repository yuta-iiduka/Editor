console.log("x is called.");

const side_contents = document.querySelector("#side-contents");
const side_info = document.querySelector("#side-info");

const sm = new SideMenu("body",SideMenu.MODE.RIGHT); //b.dom,SideMenu.MODE.RIGHT
sm.build(side_contents);

const scheduler = new Scheduler("#schedule");
scheduler.make("1");
scheduler.make("2");
scheduler.make("3");
scheduler.make("4");
scheduler.make("5");

function init_scheduler(){
    let pro = new Promise((resolve)=>{console.log("start");resolve();})
    for(let i = 0; i<30; i++){
        scheduler.active_data = i;
        pro = new Promise((resolve)=>{
            for(let d = 0; d<120; d++){
                const b = scheduler.item(`data ${i}:${d} block`,{x:i,y:d,z:1,w:1,h:1});
                b.sizableX = false;
                b.dblclick = (e)=>{
                    side_info.innerHTML = b.id;
                    sm.show();
                }
                b.pack.addEventListener("click", (e)=>{
                    side_info.innerHTML = b.id;
                    sm.show();
                });
            }
            resolve();
        });
    }
    pro.then(()=>{console.log("end")});
}

init_scheduler();
scheduler.build();


const pops = [
    new PopCard().build().title("1").message(),
    new PopCard().build().title("2").message(),
    new PopCard().build().title("3").message(),
    new PopCard().build().title("4").message(),
    new PopCard().build().title("5").message(),
    new PopCard().build().title("6").message().click(()=>{console.log("This is 6");}),
]

function ppp(){
    for(let p of pops){
        p.show();
    }
}