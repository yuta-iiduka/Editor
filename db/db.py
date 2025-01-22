from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

# 標準ライブラリのインポート
from functools import wraps
import datetime, inspect, sys, json, ast

db = SQLAlchemy()

# デコレータの初期化
def transaction(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            db.session.begin(True)
            result = func(*args, **kwargs)
            db.session.commit()
            return result
            
        except Exception as e:
            db.session.rollback()
            raise e
                
    return wrapper

def models():
    """ Modelオブジェクトの辞書型をを返却する関数
    """
    
    mdls = inspect.getmembers( sys.modules[__name__], inspect.isclass)
    return {name:cls for name, cls in mdls if "SQLAlchemy" not in name and "UserMixin" not in name}

def primary_keys(cls):
    return [key.name for key in cls.__table__.primary_key.columns]

def types(cls):
    return {col.name: col.type.__str__() for col in cls.__table__.columns}

def tableinfo(modelname):
    """
    ``` 
        # create
        d = {"key":"val"}
        mdl = mdl("table_name")["class"]
        db.session.add(mdl(**d))
        db.session.commit()
        # update, delete
        d = {"key":"val"}
        mdl = mdl("table_name")["class"]
        m = mdl.query.filter_by(**d).first()
        update = {"x":"y"}
        for k,v in update.items():
            setattr(m,k,v)
        db.session.add(m)
        db.session.commit()
    ```
    """
    m = models()[modelname]
    return {
        "name":modelname,
        "tablename":m.__tablename__,
        "class":m,
        "primary_keys":primary_keys(m),
        "types":types(m),
    }

def tablesinfo():
    m = models()
    d = {}
    for k,v in m.items():
        d[k] = tableinfo(k)

    return d


def parse(modelname,data):
    ti = tableinfo(modelname)
    result = {}
    for k,v in data.items():
        if k in ti["types"]:
            typ = ti["types"][k]
            val = None

            # 全タイプを列挙しておく
            if typ == "INTEGER":
                val = int(v)
            elif typ == "DATETIME":
                val = parse_datetime(v)
            elif typ == "ARRAY":
                if k in ti["primary_keys"]:
                    val = ast.literal_eval(v)
                else:
                    val = parse_list(v)
            elif "VARCHAR" in typ:
                val = v

            result[k] = val
        else:
            pass

    return result

def parse_list(s):
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        pass

    try:
        return ast.literal_eval(s)
    except (ValueError, SyntaxError):
        pass

    return s.split(",")

def parse_datetime(s):
    format_list = [
        "%Y-%m-%d %H:%M:%S",
        "%Y/%m/%d %H:%M:%S"
    ]
    for f in format_list:
        try:
            return datetime.datetime.strptime(s, f)
        except ValueError:
            pass
    return None

class Users(db.Model,UserMixin):
    """ usersテーブル
    
    """
    __tablename__ = "users"
    #__bind_key__ = ""
    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(64), nullable=True)
    email      = db.Column(db.String(64), nullable=False)
    password_  = db.Column("password", db.String(64), nullable=False ,default="")
    created_at = db.Column(db.DateTime, default=datetime.datetime.now())
    updated_at = db.Column(db.DateTime, default=datetime.datetime.now(), onupdate=datetime.datetime.now())
    deleted_at = db.Column(db.DateTime, default=None)

    @property
    def password(self):
        raise AttributeError("読み取り不可")
    
    @password.setter
    def password(self,password):
        self.password_ = generate_password_hash(password)
        
    def verify_password(self, password):
        return check_password_hash(self.password_, password)
        
    def is_duplicate_name(self):
        return Users.query.filter_by(name=self.name).first() is not None

    def is_duplicate_email(self):
        return Users.query.filter_by(name=self.email).first() is not None

if __name__ == "__main__":
    print(tableinfo("Users"))