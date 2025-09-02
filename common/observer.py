import tkinter as tk
from tkinter import ttk, filedialog
import subprocess
import threading
import queue
import time
import re

# ======== 通信監視処理（バックグラウンド） ========
def get_netstat_data(protocol_filter="ALL", ip_filter="", port_filter=""):
    try:
        result = subprocess.run(["netstat", "-ano"], capture_output=True, text=True, shell=True)
        lines = result.stdout.splitlines()
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")

        connections = []
        for line in lines:
            line = line.strip()
            if not (line.startswith("TCP") or line.startswith("UDP")):
                continue
            if protocol_filter != "ALL" and not line.startswith(protocol_filter):
                continue

            parts = re.split(r"\s+", line)
            if len(parts) < 4:
                continue
            if line.startswith("TCP"):
                proto, local, remote, state, pid = parts[:5]
            else:
                proto, local, remote, pid = parts[0], parts[1], "", parts[-1]
                state = ""

            if ip_filter and ip_filter not in local and ip_filter not in remote:
                continue
            if port_filter and (f":{port_filter}" not in local and f":{port_filter}" not in remote):
                continue

            proc_name, cmdline = get_process_info(pid)
            conn_tuple = (timestamp, proto, local, remote, state, pid, proc_name, cmdline)
            connections.append(conn_tuple)
        return connections
    except Exception as e:
        return [(f"[ERROR] {str(e)}", "", "", "", "", "", "", "")]

def get_process_info(pid):
    try:
        result = subprocess.run(
            ["wmic", "process", "where", f"ProcessId={pid}", "get", "Name,CommandLine", "/FORMAT:LIST"],
            capture_output=True, text=True, shell=True
        )
        output = result.stdout.strip()
        info = {}
        for line in output.splitlines():
            if "=" in line:
                k, v = line.split("=", 1)
                info[k.strip()] = v.strip()
        name = info.get("Name", "N/A")
        cmd = info.get("CommandLine", "")[:150]
        return name, cmd
    except:
        return "N/A", ""

def worker():
    while True:
        proto = proto_var.get()
        ip_f = ip_entry.get().strip()
        port_f = port_entry.get().strip()
        data = get_netstat_data(proto, ip_f, port_f)
        q.put(data)
        time.sleep(5)

# ======== GUI更新処理 ========
def update_gui():
    try:
        while not q.empty():
            data = q.get_nowait()
            tree.delete(*tree.get_children())
            for row in data:
                tree.insert("", tk.END, values=row)
    except queue.Empty:
        pass
    root.after(1000, update_gui)

def save_log():
    file_path = filedialog.asksaveasfilename(defaultextension=".txt", filetypes=[("Text files", "*.txt")])
    if file_path:
        with open(file_path, "w", encoding="utf-8") as f:
            for row_id in tree.get_children():
                row = tree.item(row_id)["values"]
                f.write("\t".join(str(col) for col in row) + "\n")

# ======== ソート機能追加 ========
sort_state = {}

def sort_column(col):
    data = [(tree.set(k, col), k) for k in tree.get_children('')]
    descending = sort_state.get(col, False)
    sort_state[col] = not descending

    def try_float(s):
        try:
            return float(s)
        except:
            return s.lower() if isinstance(s, str) else s

    data.sort(key=lambda t: try_float(t[0]), reverse=descending)
    for index, (_, k) in enumerate(data):
        tree.move(k, '', index)

# ======== GUI構築 ========
root = tk.Tk()
root.title("ネットワーク通信監視ツール（完全版 + ソート対応）")
root.geometry("1200x700")
root.configure(bg="#2b2b2b")

# === フィルタUI ===
filter_frame = tk.Frame(root, bg="#2b2b2b")
filter_frame.pack(pady=5)

tk.Label(filter_frame, text="プロトコル:", fg="white", bg="#2b2b2b").grid(row=0, column=0, padx=5)
proto_var = tk.StringVar(value="ALL")
tk.OptionMenu(filter_frame, proto_var, "ALL", "TCP", "UDP").grid(row=0, column=1)

tk.Label(filter_frame, text="IPフィルタ:", fg="white", bg="#2b2b2b").grid(row=0, column=2, padx=5)
ip_entry = tk.Entry(filter_frame, width=20)
ip_entry.grid(row=0, column=3, padx=5)

tk.Label(filter_frame, text="ポートフィルタ:", fg="white", bg="#2b2b2b").grid(row=0, column=4, padx=5)
port_entry = tk.Entry(filter_frame, width=10)
port_entry.grid(row=0, column=5, padx=5)

save_button = tk.Button(filter_frame, text="ログを保存", command=save_log)
save_button.grid(row=0, column=6, padx=10)

# === Treeviewテーブル（スクロール付き） ===
tree_frame = tk.Frame(root, bg="#2b2b2b")
tree_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

columns = ("time", "proto", "local", "remote", "state", "pid", "pname", "cmd")
tree = ttk.Treeview(tree_frame, columns=columns, show="headings")

tree.heading("time", text="TIME", command=lambda: sort_column("time"))
tree.column("time", width=130, anchor="w", stretch=False)

tree.heading("proto", text="PROTO", command=lambda: sort_column("proto"))
tree.column("proto", width=60, anchor="w", stretch=False)

tree.heading("local", text="LOCAL", command=lambda: sort_column("local"))
tree.column("local", width=180, anchor="w", stretch=False)

tree.heading("remote", text="REMOTE", command=lambda: sort_column("remote"))
tree.column("remote", width=180, anchor="w", stretch=False)

tree.heading("state", text="STATE", command=lambda: sort_column("state"))
tree.column("state", width=120, anchor="w", stretch=False)

tree.heading("pid", text="PID", command=lambda: sort_column("pid"))
tree.column("pid", width=60, anchor="w", stretch=False)

tree.heading("pname", text="PROCESS", command=lambda: sort_column("pname"))
tree.column("pname", width=140, anchor="w", stretch=False)

tree.heading("cmd", text="CMDLINE", command=lambda: sort_column("cmd"))
tree.column("cmd", width=400, anchor="w", stretch=False)

# スクロールバー配置（gridで整列）
tree.grid(row=0, column=0, sticky="nsew")

scrollbar_y = tk.Scrollbar(tree_frame, orient="vertical", command=tree.yview)
scrollbar_y.grid(row=0, column=1, sticky="ns")

scrollbar_x = tk.Scrollbar(tree_frame, orient="horizontal", command=tree.xview)
scrollbar_x.grid(row=1, column=0, sticky="ew")

tree.configure(yscrollcommand=scrollbar_y.set, xscrollcommand=scrollbar_x.set)

tree_frame.grid_rowconfigure(0, weight=1)
tree_frame.grid_columnconfigure(0, weight=1)

# ======== スレッド起動・更新開始 ========
q = queue.Queue()
threading.Thread(target=worker, daemon=True).start()
update_gui()
root.mainloop()
