const d1 = new Doodle(".body");
const d2 = new Doodle(".body");



const g = new Grid(32,32);
const o = new Sticky();
const go = new GridObject();
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
