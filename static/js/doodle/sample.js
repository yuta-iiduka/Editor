
// const g = new GridFixLocal(1440,64,8,64,"#sample");
// const b = new Block(1,1,2,1,2).make("BLOCK");
// b.draw();
// g.append(b.id,b);
// g.draw();

const scheduler = new Scheduler("#sample");
scheduler
.make("1")
.make("2")
.make("3")
.make("4")
.make("5")
scheduler.build()

sm = new SideMenu("body",SideMenu.MODE.RIGHT); //b.dom,SideMenu.MODE.RIGHT
sm.build(document.createTextNode("xxx"));
