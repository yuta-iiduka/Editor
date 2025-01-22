from functools import wraps
from logging import (
    getLogger, handlers,Formatter,
    DEBUG,INFO,ERROR,CRITICAL
)
import inspect
import traceback

logger = getLogger(__name__)
logger.setLevel(DEBUG)
file_handler = handlers.RotatingFileHandler(
    r"./log/app.log",
    mode="a",
    maxBytes=100 * 1024,
    backupCount=3,
    encoding="utf-8"
)
format = Formatter('%(asctime)s : %(levelname)s : %(filename)s - %(message)s')
file_handler.setFormatter(format)
logger.addHandler(file_handler)


def log(func):
    """
    利用方法：
    @log
    def hoge():
        pass
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        frame = inspect.currentframe().f_back
        module_name = "コマンドによる実行"
        try:
            module_object = inspect.getmodule(frame)
            module_name = module_object.__name__
        except Exception:
            pass
        args_name = inspect.getfullargspec(func).args
        # source = inspect.getsource(func)
        sep = "\n"
        try:
            logger.info("開始 : [{}.py] - [def {}()]".format(module_name,func.__name__))
            logger.info("引数 : {} : {} {}".format(args_name, args, kwargs))
            result = func(*args, **kwargs)
            # logger.debug("処理 : {}".format(source))            
            logger.info("終了 : [{}.py] - [def {}()]".format(module_name,func.__name__))
            return result
        except Exception as e:
            e_message = traceback.format_exc()
            # 必要な部分だけ抽出
            e_log = sep.join(e_message.split(sep)[-4:])
            logger.error("例外 : [{}.py] - [def {}()]{}{}".format(module_name,func.__name__,sep,e_log))
            raise e
    return wrapper

@log
def sample(s="this is log sample"):
    print(s)


if __name__ == "__main__":
    sample("Hello World")