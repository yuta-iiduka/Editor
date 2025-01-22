from flask import (
    Blueprint,render_template,redirect,jsonify,
    url_for,flash,request
)
from db.db import db, transaction,tableinfo, tablesinfo, parse
from logger import logger, log


NAME = "debugger"
URL_PREFIX = "/{}".format(NAME)
app = Blueprint(NAME, __name__, url_prefix=URL_PREFIX)

@app.route("/",methods=["GET"])
@transaction
@log
def debugger():
    return render_template("debugger/debugger.html")


@app.route("/table/index",methods=["GET"])
@log
def table_index():
    models = tablesinfo()
    print(models)
    return render_template("debugger/table_index.html", models=models)

@app.route("/table/<tablename>",methods=["GET"])
@log
def table_control(tablename):
    model = tableinfo(tablename)
    data  = model["class"].query.all()
    print(model)
    return render_template("debugger/table_control.html", model=model, data=data)


@app.route("/table/<tablename>",methods=["POST"])
@log
def table_post(tablename):
    message = ""
    data_list = request.get_json()
    model = tableinfo(tablename)
    primary_keys = model["primary_keys"]
    for data in data_list:
        data = parse(tablename,data)
        print(data)
        fi = {}
        for k in primary_keys:
            fi[k] = data[k]
        
        target = model["class"].query.filter_by(**fi).first()
        if target is None:
            target = model["class"](**data)
        else:
            for n, v in data.items():
                if n not in primary_keys:
                    setattr(target,n,v)
        db.session.add(target)
        db.session.commit()


    return jsonify(message)
