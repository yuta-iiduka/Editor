import re, inspect
from functools import wraps
from flask import render_template

class Validation():

    UNEXPECTED_ERROR = "予期しないエラーです"

    @classmethod
    def check_min_value(cls,min,val):
        """最小値は{}です"""
        result = True
        val = int(val) if isinstance(val,str) else val
        min = int(min) if isinstance(min,str) else min
        if val >= min :
            result = False
        return result

    @classmethod
    def check_max_value(cls,max,val):
        """最大値は{}です"""
        result = True
        val = val if isinstance(val,str) else int(val)
        max = max if isinstance(max,str) else int(max)
        if val <= max:
            result = False
        return result
    
    @classmethod
    def check_regex(cls,reg,val):
        """パターンにマッチしません"""
        return not(bool(re.fullmatch("{}".format(reg),val)))

    @classmethod
    def check_equal_value(cls,val1=None,val2=None):
        """値が一致しません"""
        result = True        
        if val1 == val2:
            result = False
        return result
    
    @classmethod
    def check_include(cls,text,word):
        """{}が含まれいません"""
        result = True
        if word in text:
            result = False
        return result
    
    @classmethod
    def check_not_include(cls,text,word):
        """{}が含まれています"""
        return not(cls.check_include(text,word))
    
    @classmethod
    def check_not_null(cls,v):
        """値がありません"""
        return v is None

    def __init__(self, data):
        self.data = data
        self.result = False
        self.messages = []

    @property
    def result(self):
        return any(self.messages)

    def _check(self):
        """ チェック関数
        
            オーバーライド対応が必要
        """
        return None
    
    def check(self):
        self.messages = []
        try:
            self._check()
            return self.result
        except Exception as e:
            self.messages.append(Validation.UNEXPECTED_ERROR)
            return self.result
        
    def append(self,message,*args):
        self.messages.push(message.format(*args))


class Check:

    ARGS_ERROR = "入力した値が適切ではありません"
    CHECKER_ERROR = "指定されたchecker関数は呼び出しできません"
    REGEX_ALPHABET = "[A-Za-z0-9]+"

    messages = {}
    result = True
    injection = None
    is_fast = False
    is_late = False
    arguments = ()
    keywords = {}

    # バリデーションクラスのメンバ変数(Validationクラスかそのサブクラス)
    vc = Validation

    @classmethod
    def inspect(cls,checker,n,v=None):
        def dec(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                sig = inspect.signature(func)
                bound_args = sig.bind(*args, **kwargs)
                bound_args.apply_defaults()
                for name,value in bound_args.arguments.items():
                    if name == n :
                        # result = checker(v,value) if v is not None else checker(value)
                        result = cls.invoke(checker,v,value)
                        if result:
                            cls.messages[n] = cls.format(checker.__doc__,v)
                            cls.result = False

                ret = None
                if cls.result == False and cls.is_fast == True:
                    kwargs["messages"] = cls.messages
                    kwargs["result"] = cls.result
                    args = args + cls.arguments
                    kwargs = {**kwargs , **cls.keywords}
                    ret = cls.injection(*args, **kwargs) if callable(cls.injection) else func(*args, **kwargs)
                elif cls.result == False and cls.is_late == True:

                    #オリジナル関数の場合
                    if func is inspect.unwrap(func):
                        kwargs["messages"] = cls.messages
                        kwargs["result"] = cls.result
                        args = args + cls.arguments
                        kwargs = {**kwargs , **cls.keywords}
                        ret = cls.injection(*args, **kwargs) if callable(cls.injection) else func(*args, **kwargs)
                    
                    #ラッピング関数の場合
                    else:
                        ret = func(*args, **kwargs) if callable(cls.injection) else func(*args, **kwargs)
                elif cls.result == True:
                    ret = func(*args, **kwargs)
                else:
                    ret = func(*args, **kwargs)

                return ret
            return wrapper
        return dec

    @classmethod
    def min(cls,n,v):
        """
        n:名前
        v:基準値
        """
        return cls.inspect(cls.vc.check_min_value,n,v)
    
    @classmethod
    def max(cls,n,v):
        return cls.inspect(cls.vc.check_max_value,n,v)
    
    @classmethod
    def not_null(cls,n):
        return cls.inspect(cls.vc.check_not_null,n)
    
    @classmethod
    def equal(cls,n):
        """
        n:名前 値が配列[v1,v2]であることを前提とする
        """
        return cls.inspect(cls.vc.check_equal_value,n)
    
    @classmethod
    def regex(cls,n,v="[A-Za-z0-9]+"):
        return cls.inspect(cls.vc.check_regex,n,v)

    @classmethod
    def aphabet(cls,n):
        return cls.inspect(cls.vc.check_regex,n,cls.REGEX_ALPHABET)

    @classmethod
    def include(cls,n):
        return  cls.inspect(cls.vc.check_include,n)
    
    @classmethod
    def fast(cls,injection,*arguments,**keywords):
        def dec(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                if callable(injection):
                    cls.injection = injection
                    cls.is_fast = True
                    cls.is_late = False
                    cls.arguments = arguments
                    cls.keywords = keywords
                return func(*args, **kwargs)
            return wrapper
        return dec
    
    @classmethod
    def late(cls,injection,*arguments,**keywords):
        def dec(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                if callable(injection):
                    cls.injection = injection
                    cls.is_fast = False
                    cls.is_late = True
                    cls.arguments = arguments
                    cls.keywords = keywords
                return func(*args, **kwargs)
            return wrapper
        return dec
    
    @classmethod
    def init(cls):
        del cls.messages
        cls.messages = {}
        cls.result = True
        # cls.is_fast = False
        # cls.is_late = False
        cls.arguments = ()
        cls.keywords = {}

    @classmethod
    def format(cls,doc,val):
        message = ""
        if val is None:
            message += doc
        elif isinstance(doc,dict):
            message += doc.format(**val)
        elif isinstance(doc,list):
            message += doc.format(*val)
        else:
            message += doc.format(val)
        return message

    @classmethod
    def invoke(cls,checker,baseV,argV):
        result = True
        if callable(checker):
            if isinstance(argV,dict) and checker != cls.vc.check_not_null:
                result = checker(baseV,**argV.values()) if baseV is not None else checker(**argV.values())
            elif isinstance(argV,list) and checker != cls.vc.check_not_null:
                result = checker(baseV,*argV) if baseV is not None else checker(*argV)
            else:
                result = checker(baseV,argV) if baseV is not None else checker(argV)
        else:
            cls.messages["checker_error"] = cls.CHECKER_ERROR
        return result

    
    @classmethod
    def info(cls,*args,**kwargs):
        c = Check(*args,**kwargs)
        return c
        
    def __init__(self, *args, **kwargs):
        self.messages = Check.messages.copy() # Check.messages[:]
        self.result = Check.result
        self.arguments = args[:]
        self.keywords = kwargs.copy()
        Check.init()

    @property
    def text(self):
        return "\n".join(self.messages.values())
    
    @property
    def data(self):
        return {
            "message":self.messages,
            "result":self.result,
            "arguments":self.arguments,
            "keywords":self.keywords
        }

def test(*args, **kwargs):
    c = Check(*args,**kwargs)
    print(c.data)
    return c.data
    
# @Check.fast(test)
@Check.late(test,xxx=12)
@Check.min("x",19)
@Check.max("x",77)
@Check.not_null("y")
@Check.equal("y")
@Check.regex("z")
def sample(x,y,z):
    print(x)
    print(y)
    print(z)
    print(Check().result)
    # print(Check.messages)
    # print(Check.result)


# @Check.late(test,xxx=12)
@Check.fast(test)
@Check.min("x",19)
@Check.max("x",77)
@Check.not_null("y")
@Check.equal("y")
@Check.regex("z")
def sample2(x,y,z):
    print(x)
    print(y)
    print(z)
    print(Check().data)
    # print(Check.messages)
    # print(Check.result)


if __name__ == "__main__":
    sample2(55,y=[None,1],z="あああ")
    sample(13,y=[None,1],z="あああ")
    sample2(44,y=[None,1],z="iii")