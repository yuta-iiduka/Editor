import sys
import platform
import socket
import struct
import threading
import queue
import time
from datetime import datetime
import tkinter as tk
from tkinter import ttk, messagebox

# ===== Windows RAW capture 定数 =====
SIO_RCVALL = 0x98000001
RCVALL_ON = 1
RCVALL_OFF = 0

# ====== ユーティリティ ======
def list_local_ipv4():
    addrs = set()
    hostname = socket.gethostname()
    try:
        for info in socket.getaddrinfo(hostname, None, socket.AF_INET, socket.SOCK_STREAM):
            addrs.add(info[4][0])
    except Exception:
        pass
    try:
        addrs.add(socket.gethostbyname(hostname))
    except Exception:
        pass
    addrs = [a for a in addrs if a != "127.0.0.1"] + (["127.0.0.1"] if "127.0.0.1" in addrs or not addrs else [])
    return addrs or ["127.0.0.1"]

def list_local_ipv6_with_scope():
    """(display, addr, scopeid) のリスト。display は 'addr%scope' 形式。"""
    seen = set()
    out = []
    hostname = socket.gethostname()
    try:
        infos = socket.getaddrinfo(hostname, None, socket.AF_INET6, socket.SOCK_STREAM)
        for af, st, pr, ca, sa in infos:
            addr, port, flow, scope = sa
            key = (addr, scope)
            if key in seen:
                continue
            seen.add(key)
            display = f"{addr}%{scope}" if scope else addr
            out.append((display, addr, scope))
    except Exception:
        pass
    out_no_loop = [x for x in out if x[0].split('%')[0] != "::1"]
    if any(x[0].split('%')[0] == "::1" for x in out):
        out_no_loop.append(("::1", "::1", 0))
    return out_no_loop or [("::1", "::1", 0)]

def parse_addr_zone(s: str):
    """'addr%scope' → ('addr', scopeid:int)。%無なら scope=0"""
    if "%" in s:
        addr, zone = s.split("%", 1)
        try:
            scope = int(zone)
        except ValueError:
            scope = 0
        return addr, scope
    return s, 0

def bytes_to_hex_ascii(b, max_len=64):
    data = b[:max_len]
    hexpart = " ".join(f"{x:02x}" for x in data)
    asciipart = "".join(chr(x) if 32 <= x <= 126 else "." for x in data)
    return f"{hexpart}  | {asciipart}"

# ====== IPv4 パーサ（TCP/UDP/ICMP） ======
def parse_ipv4_packet(data):
    if len(data) < 20:
        return None
    v_ihl, tos, total_length, identification, flags_frag, ttl, proto, checksum, src, dst = struct.unpack(
        "!BBHHHBBH4s4s", data[:20]
    )
    version = v_ihl >> 4
    ihl = (v_ihl & 0x0F) * 4
    if version != 4 or len(data) < ihl:
        return None

    src_ip = socket.inet_ntoa(src)
    dst_ip = socket.inet_ntoa(dst)

    payload = data[ihl:]
    src_port = None
    dst_port = None
    proto_name = str(proto)

    if proto == socket.IPPROTO_TCP and len(payload) >= 20:
        (src_port, dst_port, seq, ack, offset_reserved_flags, window, chk, urgp) = struct.unpack(
            "!HHLLHHHH", payload[:20]
        )
        data_offset = (offset_reserved_flags >> 12) * 4
        proto_name = "TCP"
        l4_payload = payload[data_offset:] if len(payload) >= data_offset else b""
    elif proto == socket.IPPROTO_UDP and len(payload) >= 8:
        src_port, dst_port, length, chk = struct.unpack("!HHHH", payload[:8])
        proto_name = "UDP"
        l4_payload = payload[8:]
    elif proto == socket.IPPROTO_ICMP and len(payload) >= 4:
        _type, _code, _chk = struct.unpack("!BBH", payload[:4])
        proto_name = "ICMP"
        l4_payload = payload[4:]
    else:
        l4_payload = payload

    return {
        "ipver": 4,
        "proto": proto_name,
        "src": src_ip,
        "dst": dst_ip,
        "sport": src_port,
        "dport": dst_port,
        "payload": l4_payload,
        "length": len(data),
    }

# ====== IPv6 ICMPv6 簡易パース ======
def parse_icmpv6_packet(payload, src_addr, dst_addr):
    info = ""
    if len(payload) >= 4:
        t, c, _chk = struct.unpack("!BBH", payload[:4])
        info = f"type={t} code={c} | "
    return {
        "ipver": 6,
        "proto": "ICMPv6",
        "src": src_addr,
        "dst": dst_addr,
        "sport": None,
        "dport": None,
        "payload": payload,
        "length": len(payload),
        "extra": info,
    }

# ====== 簡易フィルタ ======
def simple_filter(packet, filt_text):
    if not filt_text:
        return True
    t = (filt_text or "").strip().lower()
    if t == "tcp":
        return packet["proto"] == "TCP"
    if t == "udp":
        return packet["proto"] == "UDP"
    if t == "icmp":
        return packet["proto"] == "ICMP"
    if t == "icmpv6":
        return packet["proto"] == "ICMPv6"
    if t.startswith("port "):
        try:
            p = int(t.split()[1])
            return (packet["sport"] == p) or (packet["dport"] == p)
        except Exception:
            return True
    return True

# ====== キャプチャ・スレッド（IPv4 全量） ======
class IPv4SnifferThread(threading.Thread):
    def __init__(self, iface_ip, out_q, stop_event, filt_text_getter):
        super().__init__(daemon=True)
        self.iface_ip = iface_ip
        self.out_q = out_q
        self.stop_event = stop_event
        self.filt_text_getter = filt_text_getter

    def run(self):
        if platform.system() != "Windows":
            self.out_q.put(("ERR", "ERR", "", "", "", "", "Windows専用（SIO_RCVALL, IPv4）です。", ""))
            return
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_IP)
        except PermissionError as e:
            self.out_q.put(("ERR", "ERR", "", "", "", "", f"権限エラー: 管理者で実行してください ({e})", ""))
            return
        except Exception as e:
            self.out_q.put(("ERR", "ERR", "", "", "", "", f"ソケット作成失敗: {e}", ""))
            return

        try:
            s.bind((self.iface_ip, 0))
            s.setsockopt(socket.IPPROTO_IP, socket.IP_HDRINCL, 1)
            s.ioctl(SIO_RCVALL, RCVALL_ON)
        except Exception as e:
            self.out_q.put(("ERR", "ERR", "", "", "", "", f"初期化失敗: {e}", ""))
            try:
                s.close()
            finally:
                return

        try:
            while not self.stop_event.is_set():
                try:
                    data, addr = s.recvfrom(65535)
                except OSError:
                    break
                pkt = parse_ipv4_packet(data)
                if not pkt:
                    continue
                if not simple_filter(pkt, self.filt_text_getter()):
                    continue
                ts = datetime.now().strftime("%H:%M:%S")
                payload_view = bytes_to_hex_ascii(pkt["payload"], max_len=64)
                dst_port = "" if pkt["dport"] is None else str(pkt["dport"])
                src_port = "" if pkt["sport"] is None else str(pkt["sport"])
                self.out_q.put((
                    ts, pkt["proto"], pkt["dst"], dst_port, pkt["src"], src_port, str(pkt["length"]), payload_view
                ))
        finally:
            try:
                s.ioctl(SIO_RCVALL, RCVALL_OFF)
            except Exception:
                pass
            s.close()

# ====== キャプチャ・スレッド（IPv6: ICMPv6のみ） ======
class ICMPv6SnifferThread(threading.Thread):
    def __init__(self, iface_ip6_display, out_q, stop_event, filt_text_getter):
        super().__init__(daemon=True)
        self.iface_ip6_display = iface_ip6_display  # 'addr%scope' or 'addr'
        self.out_q = out_q
        self.stop_event = stop_event
        self.filt_text_getter = filt_text_getter

    def run(self):
        try:
            s = socket.socket(socket.AF_INET6, socket.SOCK_RAW, socket.IPPROTO_ICMPV6)
        except PermissionError as e:
            self.out_q.put(("ERR", "ERR", "", "", "", "", f"権限エラー(IPv6): 管理者で実行してください ({e})", ""))
            return
        except Exception as e:
            self.out_q.put(("ERR", "ERR", "", "", "", "", f"IPv6ソケット作成失敗: {e}", ""))
            return

        addr, scope = parse_addr_zone(self.iface_ip6_display)
        bound_dst_display = self.iface_ip6_display
        try:
            s.bind((addr, 0, 0, scope))
        except Exception:
            try:
                s.bind(("::", 0, 0, 0))
                bound_dst_display = ""
            except Exception as e:
                self.out_q.put(("ERR", "ERR", "", "", "", "", f"IPv6 bind 失敗: {e}", ""))
                s.close()
                return

        try:
            while not self.stop_event.is_set():
                try:
                    data, addrinfo = s.recvfrom(65535)
                except OSError:
                    break
                src_addr = addrinfo[0] if isinstance(addrinfo, tuple) and addrinfo else ""
                pkt = parse_icmpv6_packet(data, src_addr, bound_dst_display)
                if not simple_filter(pkt, self.filt_text_getter()):
                    continue
                ts = datetime.now().strftime("%H:%M:%S")
                payload_view = pkt.get("extra", "") + bytes_to_hex_ascii(pkt["payload"], max_len=64)
                self.out_q.put((
                    ts, pkt["proto"], pkt["dst"], "", pkt["src"], "", str(pkt["length"]), payload_view
                ))
        finally:
            s.close()

# ====== 受信（bind）リスナ：UDP ======
class UDPReceiverThread(threading.Thread):
    def __init__(self, bind_display, port, out_q, status_cb):
        super().__init__(daemon=True)
        self.bind_display = bind_display  # IPv4: '0.0.0.0'、IPv6: 'fe80::1%12' 等
        self.port = int(port)
        self.out_q = out_q
        self.status_cb = status_cb
        self.stop_event = threading.Event()
        self.sock = None

    def stop(self):
        self.stop_event.set()
        try:
            if self.sock:
                self.sock.close()
        except Exception:
            pass

    def run(self):
        try:
            # 判定：IPv6 かどうか
            is_v6 = ":" in self.bind_display
            if is_v6:
                addr, scope = parse_addr_zone(self.bind_display)
                self.sock = socket.socket(socket.AF_INET6, socket.SOCK_DGRAM)
                self.sock.bind((addr, self.port, 0, scope))
            else:
                self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                self.sock.bind((self.bind_display, self.port))
            self.sock.settimeout(0.5)
            self.status_cb(f"UDP receiver started on {self.bind_display}:{self.port}")
        except Exception as e:
            self.status_cb(f"UDP bind error: {e}")
            return

        try:
            while not self.stop_event.is_set():
                try:
                    data, addr = self.sock.recvfrom(65535)
                except socket.timeout:
                    continue
                except OSError:
                    break
                # ログ行
                local = self.sock.getsockname()
                if ":" in self.bind_display:
                    dst_ip = f"{local[0]}%{local[3]}" if len(local) >= 4 and local[3] else local[0]
                    dport = str(local[1])
                    src_ip = addr[0]
                    sport = str(addr[1])
                else:
                    dst_ip = local[0]
                    dport = str(local[1])
                    src_ip = addr[0]
                    sport = str(addr[1])

                ts = datetime.now().strftime("%H:%M:%S")
                payload_view = "[RECV] " + bytes_to_hex_ascii(data, max_len=64)
                self.out_q.put((ts, "UDP", dst_ip, dport, src_ip, sport, str(len(data)), payload_view))
        finally:
            try:
                self.sock.close()
            except Exception:
                pass
            self.status_cb(f"UDP receiver stopped on {self.bind_display}:{self.port}")

# ====== 受信（bind）リスナ：TCP（accept→各接続で受信） ======
class TCPConnHandler(threading.Thread):
    def __init__(self, conn, peer, local, out_q, status_cb, stop_event):
        super().__init__(daemon=True)
        self.conn = conn
        self.peer = peer
        self.local = local
        self.out_q = out_q
        self.status_cb = status_cb
        self.stop_event = stop_event

    def run(self):
        try:
            self.conn.settimeout(0.5)
            while not self.stop_event.is_set():
                try:
                    data = self.conn.recv(4096)
                except socket.timeout:
                    continue
                except OSError:
                    break
                if not data:
                    break
                # ログ
                if isinstance(self.local, tuple) and len(self.local) >= 2:
                    local_ip = self.local[0]
                    if len(self.local) >= 4 and self.local[3]:
                        local_ip = f"{local_ip}%{self.local[3]}"
                    local_port = str(self.local[1])
                else:
                    local_ip, local_port = "", ""

                src_ip = self.peer[0]
                src_port = str(self.peer[1])

                ts = datetime.now().strftime("%H:%M:%S")
                payload_view = "[RECV] " + bytes_to_hex_ascii(data, max_len=64)
                self.out_q.put((ts, "TCP", local_ip, local_port, src_ip, src_port, str(len(data)), payload_view))
        finally:
            try:
                self.conn.close()
            except Exception:
                pass

class TCPReceiverThread(threading.Thread):
    def __init__(self, bind_display, port, out_q, status_cb):
        super().__init__(daemon=True)
        self.bind_display = bind_display
        self.port = int(port)
        self.out_q = out_q
        self.status_cb = status_cb
        self.stop_event = threading.Event()
        self.sock = None
        self.handlers = []

    def stop(self):
        self.stop_event.set()
        try:
            if self.sock:
                self.sock.close()
        except Exception:
            pass
        for h in self.handlers:
            try:
                h.join(timeout=0.1)
            except Exception:
                pass

    def run(self):
        try:
            is_v6 = ":" in self.bind_display
            if is_v6:
                addr, scope = parse_addr_zone(self.bind_display)
                self.sock = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
                self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                self.sock.bind((addr, self.port, 0, scope))
            else:
                self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                self.sock.bind((self.bind_display, self.port))
            self.sock.listen(5)
            self.sock.settimeout(0.5)
            self.status_cb(f"TCP receiver started on {self.bind_display}:{self.port}")
        except Exception as e:
            self.status_cb(f"TCP bind/listen error: {e}")
            return

        try:
            while not self.stop_event.is_set():
                try:
                    conn, peer = self.sock.accept()
                except socket.timeout:
                    continue
                except OSError:
                    break
                local = conn.getsockname()
                h = TCPConnHandler(conn, peer, local, self.out_q, self.status_cb, self.stop_event)
                self.handlers.append(h)
                h.start()
        finally:
            try:
                self.sock.close()
            except Exception:
                pass
            self.status_cb(f"TCP receiver stopped on {self.bind_display}:{self.port}")

# ====== Sender（既存） ======
class SenderThread(threading.Thread):
    def __init__(self, proto, ipver, host, port, payload_bytes, repeat, interval, status_cb, out_q):
        super().__init__(daemon=True)
        self.proto = proto  # "UDP" / "TCP" / "ICMPv6"
        self.ipver = ipver  # "auto"/"ipv4"/"ipv6"
        self.host = host
        self.port = port
        self.payload = payload_bytes
        self.repeat = max(1, int(repeat))
        self.interval = max(0.0, float(interval))
        self.status_cb = status_cb
        self.out_q = out_q

    def _emit_row(self, proto, dst, dport, src, sport, length, payload_preview):
        ts = datetime.now().strftime("%H:%M:%S")
        self.out_q.put((ts, proto, dst, dport, src, sport, str(length), "[SENT] " + payload_preview))

    def run(self):
        try:
            if self.proto == "ICMPv6":
                # ここでは簡略化：ICMPv6は送信ログのみ（ICMPv6送信機能は前版に実装済み）
                self.status_cb("ICMPv6 sending not included in this minimal receiver update.")
                return

            family = 0
            if self.ipver == "ipv4":
                family = socket.AF_INET
            elif self.ipver == "ipv6":
                family = socket.AF_INET6

            infos = socket.getaddrinfo(self.host, self.port,
                                       family if family else 0,
                                       socket.SOCK_DGRAM if self.proto == "UDP" else socket.SOCK_STREAM)
            af, socktype, proto, canonname, sa = infos[0]
            with socket.socket(af, socktype, proto) as s:
                s.settimeout(3.0)
                if self.proto == "TCP":
                    s.connect(sa)
                    local = s.getsockname()
                    local_ip = local[0]
                    if len(local) >= 4 and local[3]:
                        local_ip = f"{local_ip}%{local[3]}"
                    local_port = str(local[1])
                    for i in range(self.repeat):
                        s.sendall(self.payload)
                        self.status_cb(f"TCP sent {len(self.payload)} bytes to {sa} ({i+1}/{self.repeat})")
                        self._emit_row("TCP", sa[0], str(sa[1]), local_ip, local_port,
                                       len(self.payload), bytes_to_hex_ascii(self.payload))
                        if i + 1 < self.repeat:
                            time.sleep(self.interval)
                else:  # UDP
                    s.connect(sa)
                    local = s.getsockname()
                    local_ip = local[0]
                    if len(local) >= 4 and local[3]:
                        local_ip = f"{local_ip}%{local[3]}"
                    local_port = str(local[1])
                    for i in range(self.repeat):
                        s.send(self.payload)
                        self.status_cb(f"UDP sent {len(self.payload)} bytes to {sa} ({i+1}/{self.repeat})")
                        self._emit_row("UDP", sa[0], str(sa[1]), local_ip, local_port,
                                       len(self.payload), bytes_to_hex_ascii(self.payload))
                        if i + 1 < self.repeat:
                            time.sleep(self.interval)

        except Exception as e:
            self.status_cb(f"Send error: {e}")

# ====== GUI ======
class PacketMonitorApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Packet Monitor (Windows stdlib) - IPv4 + ICMPv6 + Sender + Receiver")
        self.geometry("1150x800")
        self.minsize(900, 640)

        # ===== 上部：キャプチャ設定 =====
        cap_frame = ttk.LabelFrame(self, text="Capture")
        cap_frame.pack(fill="x", padx=8, pady=(8,4))

        ttk.Label(cap_frame, text="Interface IPv4:").grid(row=0, column=0, sticky="w")
        self.if4_var = tk.StringVar(value="")
        self.if4_combo = ttk.Combobox(cap_frame, textvariable=self.if4_var, width=28, state="readonly")
        self.if4_combo.grid(row=0, column=1, padx=6, sticky="w")

        ttk.Label(cap_frame, text="Interface IPv6 (ICMPv6 only):").grid(row=0, column=2, sticky="e")
        self.if6_var = tk.StringVar(value="")
        self.if6_combo = ttk.Combobox(cap_frame, textvariable=self.if6_var, width=28, state="readonly")
        self.if6_combo.grid(row=0, column=3, padx=6, sticky="w")

        ttk.Label(cap_frame, text="Filter:").grid(row=0, column=4, sticky="e")
        self.filter_var = tk.StringVar()
        self.filter_entry = ttk.Entry(cap_frame, textvariable=self.filter_var, width=28)
        self.filter_entry.grid(row=0, column=5, padx=6, sticky="we")
        self.filter_entry.insert(0, "tcp / udp / icmp / icmpv6 / port 80")

        self.start_btn = ttk.Button(cap_frame, text="Start", command=self.start_sniff)
        self.start_btn.grid(row=0, column=6, padx=4)
        self.stop_btn = ttk.Button(cap_frame, text="Stop", command=self.stop_sniff, state="disabled")
        self.stop_btn.grid(row=0, column=7, padx=4)

        cap_frame.columnconfigure(5, weight=1)

        # ===== 中央：一覧（横スクロールあり） =====
        table_frame = ttk.Frame(self)
        table_frame.pack(side="top", fill="both", expand=True, padx=8, pady=8)

        columns = ("time", "proto", "dst", "dport", "src", "sport", "length", "payload")
        self.tree = ttk.Treeview(table_frame, columns=columns, show="headings")
        for key, label in [
            ("time","Time"), ("proto","Protocol"), ("dst","送信先"), ("dport","送信先Port"),
            ("src","送信元"), ("sport","送信元Port"), ("length","Length"), ("payload","Payload (hex | ascii)")
        ]:
            self.tree.heading(key, text=label)

        self.tree.column("time", width=70, stretch=False)
        self.tree.column("proto", width=90, stretch=False)
        self.tree.column("dst", width=220, stretch=True)
        self.tree.column("dport", width=90, stretch=False)
        self.tree.column("src", width=220, stretch=True)
        self.tree.column("sport", width=90, stretch=False)
        self.tree.column("length", width=80, stretch=False)
        self.tree.column("payload", width=760, stretch=True)

        vsb = ttk.Scrollbar(table_frame, orient="vertical", command=self.tree.yview)
        hsb = ttk.Scrollbar(table_frame, orient="horizontal", command=self.tree.xview)
        self.tree.configure(yscrollcommand=vsb.set, xscrollcommand=hsb.set)

        self.tree.grid(row=0, column=0, sticky="nsew")
        vsb.grid(row=0, column=1, sticky="ns")
        hsb.grid(row=1, column=0, sticky="ew")

        table_frame.rowconfigure(0, weight=1)
        table_frame.columnconfigure(0, weight=1)

        # ===== 下部：送信 =====
        send_frame = ttk.LabelFrame(self, text="Test Sender")
        send_frame.pack(fill="x", padx=8, pady=(0,8))

        ttk.Label(send_frame, text="Host/IP:").grid(row=0, column=0, sticky="e")
        self.send_host = tk.StringVar(value="127.0.0.1")
        self.host_combo = ttk.Combobox(send_frame, textvariable=self.send_host, width=40, state="normal")
        cand4 = list_local_ipv4()
        cand6 = [disp for (disp, addr, scope) in list_local_ipv6_with_scope()]
        self.host_combo["values"] = cand4 + cand6
        self.host_combo.grid(row=0, column=1, padx=6, sticky="we")

        ttk.Label(send_frame, text="Port:").grid(row=0, column=2, sticky="e")
        self.send_port = tk.StringVar(value="9000")
        ttk.Entry(send_frame, textvariable=self.send_port, width=8).grid(row=0, column=3, padx=6, sticky="w")

        ttk.Label(send_frame, text="Protocol:").grid(row=0, column=4, sticky="e")
        self.proto_var = tk.StringVar(value="UDP")
        ttk.Combobox(send_frame, textvariable=self.proto_var, values=["UDP", "TCP"], width=8, state="readonly").grid(row=0, column=5, padx=6, sticky="w")

        ttk.Label(send_frame, text="IP Version:").grid(row=0, column=6, sticky="e")
        self.ipver_var = tk.StringVar(value="auto")
        ttk.Combobox(send_frame, textvariable=self.ipver_var, values=["auto","ipv4","ipv6"], width=7, state="readonly").grid(row=0, column=7, padx=6, sticky="w")

        ttk.Label(send_frame, text="Repeat:").grid(row=0, column=8, sticky="e")
        self.repeat_var = tk.StringVar(value="1")
        ttk.Entry(send_frame, textvariable=self.repeat_var, width=6).grid(row=0, column=9, padx=6, sticky="w")

        ttk.Label(send_frame, text="Interval(s):").grid(row=0, column=10, sticky="e")
        self.interval_var = tk.StringVar(value="1.0")
        ttk.Entry(send_frame, textvariable=self.interval_var, width=6).grid(row=0, column=11, padx=6, sticky="w")

        ttk.Label(send_frame, text="Payload:").grid(row=1, column=0, sticky="e")
        self.payload_text = tk.StringVar(value="hello")
        ttk.Entry(send_frame, textvariable=self.payload_text).grid(row=1, column=1, columnspan=9, padx=6, sticky="we")

        self.as_hex_var = tk.BooleanVar(value=False)
        ttk.Checkbutton(send_frame, text="Hex (e.g. 48 65 6c 6c 6f)", variable=self.as_hex_var)\
            .grid(row=1, column=10, columnspan=2, sticky="w", padx=6)

        self.send_btn = ttk.Button(send_frame, text="Send", command=self.on_send)
        self.send_btn.grid(row=0, column=12, rowspan=2, padx=6, sticky="ns")

        send_frame.columnconfigure(1, weight=1)

        # ===== 受信設定欄（新規） =====
        recv_frame = ttk.LabelFrame(self, text="Receiver (bind & log)")
        recv_frame.pack(fill="x", padx=8, pady=(0,8))

        ttk.Label(recv_frame, text="Bind Host/IP:").grid(row=0, column=0, sticky="e")
        self.recv_host = tk.StringVar(value="0.0.0.0")  # 0.0.0.0 / :: も可
        self.recv_host_combo = ttk.Combobox(recv_frame, textvariable=self.recv_host, width=40, state="normal")
        rec_cand4 = ["0.0.0.0"] + cand4
        rec_cand6 = ["::"] + [disp for (disp, addr, scope) in list_local_ipv6_with_scope()]
        self.recv_host_combo["values"] = rec_cand4 + rec_cand6
        self.recv_host_combo.grid(row=0, column=1, padx=6, sticky="we")

        ttk.Label(recv_frame, text="Port:").grid(row=0, column=2, sticky="e")
        self.recv_port = tk.StringVar(value="9000")
        ttk.Entry(recv_frame, textvariable=self.recv_port, width=8).grid(row=0, column=3, padx=6, sticky="w")

        ttk.Label(recv_frame, text="Protocol:").grid(row=0, column=4, sticky="e")
        self.recv_proto = tk.StringVar(value="UDP")
        ttk.Combobox(recv_frame, textvariable=self.recv_proto, values=["UDP","TCP"], width=8, state="readonly").grid(row=0, column=5, padx=6, sticky="w")

        self.add_recv_btn = ttk.Button(recv_frame, text="Start Receiver", command=self.start_receiver)
        self.add_recv_btn.grid(row=0, column=6, padx=6)

        self.stop_sel_btn = ttk.Button(recv_frame, text="Stop Selected", command=self.stop_selected_receiver, state="disabled")
        self.stop_sel_btn.grid(row=0, column=7, padx=4)

        self.stop_all_btn = ttk.Button(recv_frame, text="Stop All", command=self.stop_all_receivers, state="disabled")
        self.stop_all_btn.grid(row=0, column=8, padx=4)

        # アクティブ一覧
        ttk.Label(recv_frame, text="Active:").grid(row=1, column=0, sticky="ne")
        self.recv_list = tk.Listbox(recv_frame, height=4)
        self.recv_list.grid(row=1, column=1, columnspan=8, sticky="we", padx=6, pady=(4,6))

        recv_frame.columnconfigure(1, weight=1)

        # ===== ステータス =====
        self.status = tk.StringVar(value="Ready")
        statusbar = ttk.Label(self, textvariable=self.status, anchor="w")
        statusbar.pack(side="bottom", fill="x")

        # 内部
        self.q = queue.Queue()
        self.stop_event = threading.Event()
        self.sniffer4 = None
        self.sniffer6 = None
        self.receivers = []  # [(desc, thread)]

        self.populate_interfaces()
        self.after(50, self.poll_queue)

    def populate_interfaces(self):
        addrs4 = list_local_ipv4()
        self.if4_combo["values"] = addrs4
        if addrs4:
            self.if4_var.set(addrs4[0])

        addrs6_disp = [d for (d, a, s) in list_local_ipv6_with_scope()]
        self.if6_combo["values"] = addrs6_disp
        if addrs6_disp:
            self.if6_var.set(addrs6_disp[0])

    def start_sniff(self):
        if platform.system() != "Windows":
            messagebox.showerror("Error", "このサンプルは Windows 専用です。")
            return
        started = False
        if not (self.sniffer4 and self.sniffer4.is_alive()):
            ip4 = self.if4_var.get().strip()
            if ip4:
                self.stop_event.clear()
                self.sniffer4 = IPv4SnifferThread(ip4, self.q, self.stop_event, lambda: self.filter_var.get())
                self.sniffer4.start()
                started = True
        if not (self.sniffer6 and self.sniffer6.is_alive()):
            ip6disp = self.if6_var.get().strip()
            if ip6disp:
                self.sniffer6 = ICMPv6SnifferThread(ip6disp, self.q, self.stop_event, lambda: self.filter_var.get())
                self.sniffer6.start()
                started = True
        if started:
            self.start_btn.configure(state="disabled")
            self.stop_btn.configure(state="normal")
            self.status.set("Capturing...（IPv4=全量, IPv6=ICMPv6のみ / 管理者権限が必要）")

    def stop_sniff(self):
        self.stop_event.set()
        self.start_btn.configure(state="normal")
        self.stop_btn.configure(state="disabled")
        self.status.set("Stopped")

    def clear_table(self):
        for i in self.tree.get_children():
            self.tree.delete(i)

    def poll_queue(self):
        try:
            while True:
                item = self.q.get_nowait()
                self.tree.insert("", "end", values=item)
        except queue.Empty:
            pass
        self.after(50, self.poll_queue)

    # ===== Sender 操作 =====
    def on_send(self):
        host = self.send_host.get().strip()
        port_s = self.send_port.get().strip()
        proto = self.proto_var.get()
        ipver = self.ipver_var.get()
        repeat = self.repeat_var.get()
        interval = self.interval_var.get()
        if not host or not port_s.isdigit():
            messagebox.showwarning("Input", "Host と Port を正しく入力してください。")
            return
        port = int(port_s)

        text = self.payload_text.get()
        if self.as_hex_var.get():
            try:
                cleaned = "".join(ch for ch in text if ch in "0123456789abcdefABCDEF ")
                payload = bytes(int(x, 16) for x in cleaned.split())
            except Exception as e:
                messagebox.showerror("Payload", f"Hex 解析に失敗しました: {e}")
                return
        else:
            payload = text.encode("utf-8", errors="replace")

        def status_cb(msg):
            self.status.set(msg)

        th = SenderThread(proto=proto, ipver=ipver, host=host, port=port,
                          payload_bytes=payload, repeat=repeat, interval=interval,
                          status_cb=status_cb, out_q=self.q)
        th.start()

    # ===== Receiver 操作 =====
    def start_receiver(self):
        host = self.recv_host.get().strip()
        port_s = self.recv_port.get().strip()
        proto = self.recv_proto.get()
        if not port_s.isdigit():
            messagebox.showwarning("Input", "Port を正しく入力してください。")
            return
        port = int(port_s)

        def status_cb(msg):
            self.status.set(msg)

        if proto == "UDP":
            th = UDPReceiverThread(host, port, self.q, status_cb)
            desc = f"UDP {host}:{port}"
        else:
            th = TCPReceiverThread(host, port, self.q, status_cb)
            desc = f"TCP {host}:{port}"
        th.start()
        self.receivers.append((desc, th))
        self.recv_list.insert("end", desc)
        self.stop_all_btn.configure(state="normal")
        self.stop_sel_btn.configure(state="normal")

    def stop_selected_receiver(self):
        idxs = self.recv_list.curselection()
        if not idxs:
            return
        # 後ろから消す
        for i in reversed(idxs):
            desc, th = self.receivers[i]
            try:
                th.stop()
            except Exception:
                pass
            th.join(timeout=1.0)
            del self.receivers[i]
            self.recv_list.delete(i)
        if not self.receivers:
            self.stop_all_btn.configure(state="disabled")
            self.stop_sel_btn.configure(state="disabled")

    def stop_all_receivers(self):
        for desc, th in self.receivers:
            try:
                th.stop()
            except Exception:
                pass
        for desc, th in self.receivers:
            try:
                th.join(timeout=1.0)
            except Exception:
                pass
        self.receivers.clear()
        self.recv_list.delete(0, "end")
        self.stop_all_btn.configure(state="disabled")
        self.stop_sel_btn.configure(state="disabled")
        self.status.set("All receivers stopped")

# ====== エントリポイント ======
if __name__ == "__main__":
    app = PacketMonitorApp()
    app.mainloop()
