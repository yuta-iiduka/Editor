from flask import (
    Flask,
    redirect,render_template,url_for
)
from flask_wtf.csrf import CSRFProtect
from flask_socketio import SocketIO, emit, send,join_room,leave_room,close_room,rooms,disconnect,ConnectionRefusedError
from flask_migrate import Migrate
from flask_login import login_required


# モデルのインポート
from db.db import db
from logger import logger, log

# 分割したアプリをインポート
from _scheduler import task
from _doodle import doodle
from _user import user
from _debugger import debugger


app = Flask(__name__)
app.config["SECRET_KEY"] = "xxxxxxxx"
app.config['JSON_AS_ASCII'] = False
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = False
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///sqlite.db'
# app.config["SQLALCHEMY_BINDS"] = {
#     "sticky": constant["SQLALCHEMY_DATABASE_URI"],
#     "card": constant["SQLALCHEMY_DATABASE_URI_CARD"]
# }

# 各機能を初期化
db.init_app(app)
migrate = Migrate(app, db)
csrf = CSRFProtect(app)
user.login_manager.init_app(app)
task.aps.init_app(app)
task.aps.start()

# Blueprintを統合
app.register_blueprint(doodle.app)
app.register_blueprint(user.app)
app.register_blueprint(debugger.app)


@app.route("/",methods=["GET"])
@login_required
def home():
    return render_template("home.html")

@app.route("/menu",methods=["GET"])
@login_required
def menu():
    return render_template("menu.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5555)