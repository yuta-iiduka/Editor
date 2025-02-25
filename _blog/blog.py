from flask import (
    Blueprint,render_template,redirect,jsonify,
    url_for,flash
)
from flask_login import login_required
from db.db import db
from logger import logger, log

NAME = "blog"
URL_PREFIX = "/{}".format(NAME)
app = Blueprint(NAME, __name__, url_prefix=URL_PREFIX)


@app.route("/",methods=["GET"])
@login_required
def doodle():
    return render_template("blog/blog.html")
