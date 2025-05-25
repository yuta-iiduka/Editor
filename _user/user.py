from common.validation import Check
from flask import (
    Blueprint,render_template,redirect,jsonify,
    url_for,flash,request, send_file
)
from db.db import db, transaction, Users, tableinfo
from flask_login import (
    LoginManager, UserMixin, current_user,
    login_required, login_user, logout_user
)
from logger import logger, log
from common.file import YamlData

login_manager = LoginManager()
login_manager.login_view = "user.login"
login_manager.login_message = ""
@login_manager.user_loader
def load_user(user_id):
    return Users.query.filter_by(id=user_id).first()

NAME = "user"
URL_PREFIX = "/{}".format(NAME)
app = Blueprint(NAME, __name__, url_prefix=URL_PREFIX)

# def test(*args,**kwargs):
#     c = Check(*args,**kwargs)
#     print(c.data)
#     return render_template(*args,**kwargs)

# @app.route("/test/<y>",methods=["GET"])
# @Check.late(test,"user/login.html",xxx="xxx")
# @Check.min("y",10)
# def testView(y=None):
#     return render_template("user/users.html",users=Users.query.all())

@app.route("/login",methods=["GET","POST"])
@transaction
@log
def login():
    if request.method == "POST":
        print(request.form)
        email = request.form["email"]
        password = request.form["password"]
        next = request.form["next"]
        user = Users.query.filter_by(email=email).first()
        if user is not None:
            if user.verify_password(password):
                login_user(user)
                if next is not None and next != "":
                    return redirect(next)
                else:
                    return redirect(url_for("user.users"))
            else:
                flash("パスワードが違います。")
        else:
            flash("メールアドレスが違います。",)
    return render_template("user/login.html", next=request.args.get("next"))

@app.route("/signup",methods=["GET","POST"])
@transaction
@log
def signup():
    next_ = request.args.get("next")
    if request.method == "POST":
        email = request.form["email"]
        password = request.form["password"]
        user = Users.query.filter_by(email=email).first()
        if user is None:
            user = Users(
                name = None,
                email = email,
                password = password,
            )

            db.session.add(user)

            user = Users.query.filter_by(email=email).first()

            if user is not None:
                login_user(user)
                if next_ is not None:
                    return redirect(next_)
                else:
                    return redirect("/")
            else:
                flash("ユーザ登録に失敗しました。")
        else:
            flash("既にメールアドレスが利用されています。")
    return render_template("user/signup.html")

@app.route("/logout",methods=["GET"])
@login_required
@log
def logout():
    logout_user()
    return redirect(url_for("user.login"))


@app.route("/users",methods=["GET"])
@login_required
@transaction
@log
def users():
    data = request.get_data()
    if data != b"":
        data = request.get_json()
    print(data)
    print(request.args)
    users = Users.query.all()
    return render_template("user/users.html",users=users)

@app.route("/user/<user_id>",methods=["GET"])
@login_required
@transaction
@log
def user(user_id):
    user = Users.query.filter_by(id=user_id).first()
    return render_template("user/user.html",user=user)

@app.route("/api/users", methods=["GET","POST"])
@login_required
@transaction
@log
def api_users():
    print(request.get_data())
    print(request.args)
    lst = []
    users = Users.query.all()
    for u in users:
        lst.append({"id":u.id,"name":u.name,"email":u.email})
    print(lst)
    return jsonify(lst)

@app.route("/g", methods=["GET"])
@log
def gg():
    return render_template("user/g.html")


@app.route("/api/v1/<num>", methods=["GET","POST"])
@login_required
@Check.min("num",10)
def v1_num(num):
    c = Check()
    print(c.message)
    print(c.result)
    return jsonify({"num":num})

@app.route("/api/v2/<num>", methods=["GET","POST"])
@login_required
@Check.min("num",10)
def v2_num(num):
    c = Check()
    print(c.message)
    print(c.result)
    return jsonify({"num":num})

@app.route("/yaml",methods=["GET"])
@login_required
def yaml():
    y = YamlData("etc/sample.yaml")
    print(y.data)
    # d = {"data":{"yaml":y.array(y.data),"comments":y.array(y.get_comments())}}
    d = {"data":{"yaml":y.data,"comments":y.get_comments()}}
    print(d)
    return jsonify(d)


@app.route("/download",methods=["GET"])
@login_required
def etc_file():
    return send_file("etc/sample.back.yaml",as_attachment=True)