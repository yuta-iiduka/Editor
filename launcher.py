
from common.gui import GUI
from common.file import JsonData

from tkinter import messagebox
import subprocess, threading, os, signal


def p_start():
    try:
        jd = JsonData("etc/pid.json")
        def start_bat():
            p = subprocess.Popen(["py","server.py"])
            if jd.data is None:
                jd.data = {"pid":[]}
            jd.data["pid"].append(p.pid)
            jd.write()
            return p
        t1 = threading.Thread(target=start_bat, daemon=True)
        t1.start()

        def start_browser():
            p = subprocess.Popen(["C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe","http://localhost:5555"])
            return p
        t2 = threading.Thread(target=start_browser, daemon=True)
        t2.start()

        messagebox.showinfo("Success","起動に成功しました。")
    except subprocess.CalledProcessError as e:
        messagebox.showerror("Error",f"バッチファイルの実行中にエラーが発生しました。\n{e}")
    except FileNotFoundError:
        messagebox.showerror("Error","指定されたバッチが見つかりませんでした。")

def p_end():
    try:
        jd = JsonData("etc/pid.json")
        pid_list = []
        if jd.data is not None and "pid" in jd.data:
            pid_list = jd.data["pid"]

        remove_list = []
        for pid in pid_list:
            try:
                os.kill(pid,signal.SIGTERM)
            except Exception as e:
                print(pid)
            remove_list.append(pid)

        for r in remove_list:
            jd.data["pid"].remove(r)

        jd.write()

        messagebox.showinfo("Success","停止に成功しました。")
    except Exception as e:
        messagebox.showerror("Error",f"WEBアプリケーションの停止に失敗しました。\n{e}")

if __name__ == "__main__":
    
    jd = JsonData("etc/pid.json")

    gui = GUI("Launcher",300,100)
    gui.label("WEBアプリケーションの操作を選択してください")
    gui.button("起動",p_start)
    gui.button("停止",p_end)
    if len(jd.data["pid"]) > 0:
        gui.message("プロセスIDが登録されています")
    gui.icon("etc/launcher.icon")
    gui.start()
    