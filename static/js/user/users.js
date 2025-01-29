

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


const xhr = new XMLHttpRequest();
let responseText = "";
let responseData = null;
// xhr.onload = function(){
//     if(xhr.readyState == 4 && xhr.status == 200){
//         responseText = xhr.responseText;
//         responseData = JSON.parse(responseText);
//         console.log(responseData);
//     }else{
//         alert("通信に失敗しました");
//     }
// }

const btn1 = document.querySelector("#btn1");
const btn2 = document.querySelector("#btn2");
const btn3 = document.querySelector("#btn3");
const csrf_token = document.querySelector("meta[name=csrf_token]").getAttribute("value");

btn1.addEventListener("click",function(){
    xhr.open("POST",btn1.dataset.url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader('X-CSRFToken', csrf_token);
    xhr.onload = function(){
        if(xhr.readyState == 4 && xhr.status == 200){
            responseText = xhr.responseText;
            responseData = JSON.parse(responseText);
            console.log(responseData);
        }else{
            alert("通信に失敗しました");
        }
    }
    xhr.send(JSON.stringify({}));
    console.log("btn1");
});
btn2.addEventListener("click",function(){
    xhr.open("POST",btn2.dataset.url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader('X-CSRFToken', csrf_token);  
    xhr.onload = function(){
        if(xhr.readyState == 4 && xhr.status == 200){
            responseText = xhr.responseText;
            responseData = JSON.parse(responseText);
            console.log(responseData);
        }else{
            alert("通信に失敗しました");
        }
    }
    xhr.send(JSON.stringify({}));
    console.log("btn2");
});

btn3.addEventListener("click", async function(){
    const response = await fetch(btn3.dataset.url,{
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'X-CSRFToken': csrf_token,
        },
        body: JSON.stringify({}),
    });
    if(response.ok){
        responseData = await response.json();
        console.log(responseData);
    }else{
        alert("通信に失敗しました");
    }
    console.log("btn3");
})