console.log("table_control.js");

const post_url = document.querySelector("#post-url").dataset.url;
const rj = new RequestJSON()
    .set_url_post(post_url)
    .set_func(recieve_data);

const t = new TableWrapper("#t");
t.build();
t.view = review;
t.click_tr = activate_tr;

let active_tr = null;
let active_rid = null;
let mode = 0; // {0:通常, 1:新規}
let update_data = [];

// 初期描画
review();


function recieve_data(data){
    console.log(data);
}

function make_empty_record(){
    const record = {};
    const base = t.load_columns();
    for(let d of base){
        record[d.field] = "";
    }
    return record;
}

function activate_tr(tr){

    // 全レコードの初期化
    const recs = t.body.querySelectorAll("tr");
    let tds = null;
    for(let rec of recs){
        rec.classList.remove("active");
        tds = t.body.querySelectorAll("td")
        if(tds === null){ continue; }
        for(let td of tds){
            td.style.color = "white";
        }
    }

    // アクティブなレコードの強調
    tds = tr.querySelectorAll("td");
    if(tr !== null && tr !== undefined){
        active_tr = tr;
        tr.classList.add("active");
        for(let td of tds){
            if(!is_primary(td)){
                td.setAttribute("contenteditable",true);
            }else{
                td.setAttribute("contenteditable",true);
                td.title = "プライマリーキーの変更はできません。削除して新規に登録してください。"
                td.style.color = "aqua";
            }
        }
    }

    if(tr.dataset.rid !== null && tr.dataset.rid !== undefined){
        active_rid = tr.dataset.rid;
    }

    return active_tr;
}

function activate_tr_by_rid(rid){
    const trs = t.body.querySelectorAll("tr");
    const index = t.find(rid).index;
    if(index !== null){
        trs[index].click();
    }
}

function get_active_data(){
    const tds = active_tr===null ? []: active_tr.querySelectorAll("td");
    const data = {};
    const cols = t.columns;
    for(let i=0; i<tds.length; i++){
        td = tds[i];
        const col = cols[i].field;
        data[col] = td.textContent;
    }
    return data;
}

function is_primary(td){
    const primary_keys_dom = document.querySelectorAll(".primary_keys");
    const primary_keys = [];
    const dataset = Object.keys(td.dataset).splice("value",1);
    for(let p of primary_keys_dom){
        primary_keys.push(p.textContent);
    }
    return dataset.every(function(e){return primary_keys.includes(e)});
}



function review(){
    const ui_filter = t.parent.querySelector(".ui_filter");

    const update_btn = document.createElement("button");
    update_btn.textContent = "更新";
    ui_filter.appendChild(update_btn);
    
    const delete_btn = document.createElement("button");
    delete_btn.textContent = "削除";
    ui_filter.appendChild(delete_btn);
    
    const create_btn = document.createElement("button");
    create_btn.textContent = "新規";
    create_btn.style.display = mode===0 ? "inline-block": "none";
    create_btn.addEventListener("click",function(){
        mode = 1;
        const rec = make_empty_record();
        const rid = t.add(rec);
        t.draw();
        activate_tr_by_rid(rid);
        
        // t.insert(rec).click();
    });
    ui_filter.appendChild(create_btn);
    
    const save_btn = document.createElement("button");
    save_btn.textContent = "保存";
    save_btn.style.display = mode===0 ? "none": "inline-block";
    save_btn.addEventListener("click",function(){
        // TODO:登録前のデータソートやフィルター対策(消えてしまってよいか？)
        // TODO:更新データの複数選択や重複登録の防止
        update_data.push(get_active_data());
        console.log(update_data);
        rj.post(update_data);
        mode = 0;

        // TODO:保存後の再描画
    });
    ui_filter.appendChild(save_btn);
    
    const cancel_btn = document.createElement("button");
    cancel_btn.textContent = "キャンセル";
    cancel_btn.style.display = mode===0 ? "none": "inline-block";
    cancel_btn.addEventListener("click",function(){
        mode = 0;
    });
    ui_filter.appendChild(cancel_btn);

    activate_tr_by_rid(active_rid);

    return ui_filter;
}


