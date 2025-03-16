
const g = new GridFixLocal(64,64,128,64,"#sample");


const b = new Block(1,1,2,1,2).make("BLOCK");
b.draw();

g.append(b.id,b);
g.draw();
