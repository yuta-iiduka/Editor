import re
from functools import wraps

class Validation():

    @classmethod
    def check_min_value(cls,min,val):
        """最小値は{}です"""
        result = True
        if val >= min :
            result = False
        return result

    @classmethod
    def check_max_value(cls,max,val):
        """最大値は{}です"""
        result = True
        if val <= max:
            result = False
        return result
    
    @classmethod
    def check_equal_value(cls,val1,val2):
        """{}と{}の値が一致しません"""
        result = True
        if val1 == val2:
            result = False
        return result
    
    @classmethod
    def check_include(cls,word,text):
        """{}が含まれいません"""
        result = True
        if word in text:
            result = False
        return result
    
    @classmethod
    def check_not_include(cls,word,text):
        """{}が含まれています"""
        return not(cls.check_include(word,text))
    
    @classmethod
    def check_not_null(cls,val):
        """値がありません"""
        return val is None

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
        self.message.push(message.format(*args))


class Check:

    ARGS_ERROR = "引数の指定方法が間違えています。{}"
    
    message = []
    result = True
    injection = None

    # バリデーションクラスのメンバ変数(Validationクラスかそのサブクラス)
    vc = Validation

    @classmethod
    def inspect(cls,checker,n,v=None):
        def dec(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                # TODO v=Noneの場合checkerには基準値が必要ない設定をするべき
                # 名前なし引数の場合
                if isinstance(n, (int, float)) and n < len(args):
                    #for arg in args:
                    arg = args[n]
                    if isinstance(arg, (int, float)) and checker(v,arg):
                        cls.message.append(checker.__doc__)
                        cls.result = False
                    elif isinstance(arg, str):
                        try:
                            num = int(arg)
                            if checker(v,num):
                                cls.message.append(checker.__doc__)
                                cls.result = False
                        except Exception as e:
                            cls.message.append(e)
                            cls.result = False

                elif len(args) > 0:
                    raise Exception("指定された番号の引数が存在しません")

                # 名前あり引数の場合
                for key, value in kwargs.items():
                    if key == n:
                        if isinstance(value, (int,float)) and checker(v,value):
                            cls.message.append(checker.__doc__.format(v))
                            cls.result = False
                        elif isinstance(value, str):
                            try:
                                num = int(value)
                                if checker(v,num):
                                    cls.message.append(checker.__doc__.format(v))
                                    cls.result = False
                            except Exception as e:
                                cls.message.append(e)
                                cls.result = False

                    else:
                        raise Exception("指定された名前の引数が存在しません")

                if cls.result == False and cls.injection is not None:
                    return cls.injection
                else:
                    return func(*args, **kwargs)
            return wrapper
        return dec

    @classmethod
    def min(cls,n,v):
        return cls.inspect(cls.vc.check_min_value,n,v)
    
    @classmethod
    def max(cls,n,v):
        return cls.inspect(cls.vc.check_max_value,n,v)
        
    def __init__(self):
        self.message = Check.message[:]
        self.result = Check.result
        Check.message = []
        Check.result = True

    @property
    def text(self):
        return "\n".join(self.message)



@Check.min("x",19)
def sample(x):
    print(x)
    print(Check.message())
    print(Check.result)



if __name__ == "__main__":
    sample(x=12)
