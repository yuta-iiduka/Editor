from common.validation import Check, Validation
from flask import request
from functools import wraps
import re


class FlaskCheck(Check):
    def __init__(self):
        super.__init__()

    @classmethod
    def check_form(cls,checker,n,v=None):
        """
        checker:バリデーションチェック関数
        n:フォームのname属性の値
        v:バリデーションチェックの基準値
        """
        def dec(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                if v is None:
                    # 基準値のあるチェック
                    if n in request.form and checker(v,request.form[n]):
                        cls.message.append(checker.__doc__.format(v))
                else:
                    # 基準値がないもしくは、あらかじめ基準値が決まっているチェック
                    if n in request.form and checker(request.form[n]):
                        cls.message.append(checker.__doc__)
                
                return func(*args, **kwargs)
            return wrapper
        return dec

    @classmethod
    def min_form(cls,n,v):
        return cls.check_form(cls.vc.check_min_value,n,v)
    
    @classmethod
    def not_null_form(cls,n):
        return cls.check_form(cls.vc.check_not_null,n)