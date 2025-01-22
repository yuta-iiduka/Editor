

const u = new TableWrapper("#users");
u.build();

const t = new TableBuilder("#t");
t.columns = [{field:"id",label:"ID",type:"int"},{field:"name",label:"NAME",type:"str"}];
t.data = [
    {id:1,name:"name1"},
    {id:1,name:"name1"},
    {id:1,name:"name1"},
    {id:1,name:"name1"},
    {id:1,name:"name1"},
    {id:1,name:"name1"},
    {id:1,name:"name1"},
    {id:1,name:"name1"},
    {id:1,name:"name1"},
    {id:1,name:"name1"},
    {id:1,name:"name1"},
    {id:2,name:"name2"},
    {id:3,name:"name3"},
    {id:4,name:"name4"},
    {id:5,name:"name5"},
    {id:6,name:"name6"},
    {id:7,name:"name7"},
];
t.pp = 5;
t.build();

const g = new Grid(32,32);
const o1 = new Sticky();
const o2 = new Sticky();
const o3 = new Sticky();
o1.make();
o2.wrap("#users",false);
o3.make();
o2.contextmenu = function(e){console.log("contextmenu is called!",e.pageX,e.pageY)};
o1.relative(o2);
o2.relative(o3);
g.append(o1.id,o1);
g.append(o2.id,o2);
g.append(o3.id,o3);
g.draw();

