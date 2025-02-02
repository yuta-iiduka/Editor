const d1 = new Doodle(".body");
const d2 = new Doodle(".body");
const co = new CanvasObject(1,1,1,100,100);
d1.append(co);


const g = new Grid(32,32);
const o = new Sticky();
const go = new Sticky();
go.make("HELLO");
g.append(go.id,go);

o.wrap(d1.dom);
o.borderColor = "blue";

o.resize_event = function(){
    d1.adjust();
}
g.append(o.id,o);
g.draw();
d1.adjust();
d1.draw();
d2.draw();

go.relative(o);
