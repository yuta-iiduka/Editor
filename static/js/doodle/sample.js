
const g = new GridFixLocal(64,64,128,64,"#sample");


const b = new Block(1,1,2,1,2).make("BLOCK");
b.draw();

sm = new SideMenu("body",SideMenu.MODE.RIGHT); //b.dom,SideMenu.MODE.RIGHT
sm.build(document.createTextNode("xxx"));

g.append(b.id,b);
g.draw();
