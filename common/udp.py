import socket

# 設定
ipv6_address = "fe80::e9f0:35f3:96c8:1ab8"        # 宛先IPv6アドレス（例: リンクローカルならインターフェースも必要）
port = 9000                    # 送信先ポート番号
interface = "eth0"              # リンクローカルアドレス用: インターフェース名 (Windowsなら "Ethernet" など)
num_packets = 5                 # 送信するパケット数
message = b"Hello over UDPv6!" # 送信するデータ

# ソケット作成（AF_INET6 = IPv6, SOCK_DGRAM = UDP）
sock = socket.socket(socket.AF_INET6, socket.SOCK_DGRAM)

# リンクローカルの場合、インターフェーススコープIDが必要
# Linux: if_nametoindex() で取得
# Windows: if_nametoindex() も動作するが、"Ethernet" などの名前でOKなことも
try:
    scope_id = socket.if_nametoindex(interface)
except Exception:
    # Windows で if_nametoindex が使えない場合は 0 を指定（スコープが不要なアドレスの場合）
    scope_id = 0

# 宛先アドレス（IPv6, ポート, フロー情報, スコープID）
dest = (ipv6_address, port, 0, scope_id)

# パケット送信
for i in range(num_packets):
    sock.sendto(message, dest)
    print(f"Packet {i+1} sent to {dest}")

sock.close()
