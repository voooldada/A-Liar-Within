#!/usr/bin/env python3
import http.server
import socketserver
import socket
import os

PORT = 3000
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        return super().end_headers()

    def do_GET(self):
        if self.path == '/' or self.path == '/index.html':
            self.path = '/index.html'
        elif self.path == '/tv':
            self.path = '/tv.html'
        return super().do_GET()

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "localhost"

try:
    local_ip = get_local_ip()
    handler = MyHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print("""
╔════════════════════════════════════════╗
║   🎮 A Liar Within - Servidor Local    ║
╚════════════════════════════════════════╝

📱 Acesso Local:
   - Jogo: http://localhost:%d
   - TV:   http://localhost:%d/tv

🌐 Acesso pela Rede (TV):
   - Jogo: http://%s:%d
   - TV:   http://%s:%d/tv

Pressione Ctrl+C para parar o servidor
        """ % (PORT, PORT, local_ip, PORT, local_ip, PORT))
        httpd.serve_forever()

except KeyboardInterrupt:
    print("\n\nServidor parado.")
except OSError as e:
    print(f"\nErro: Porta {PORT} já está em uso ou permissão negada.")
    print("Tente fechar outros programas que usam a porta 3000.")
