import subprocess
import qrcode
import os

# Hotspot configuration
ssid = "MyRPiHotspot"
password = "raspberry123"

def enable_hotspot():
    # Stop conflicting services
    subprocess.run(["sudo", "systemctl", "stop", "wpa_supplicant"])
    subprocess.run(["sudo", "systemctl", "start", "hostapd"])
    subprocess.run(["sudo", "systemctl", "start", "dnsmasq"])
    
    # Enable IP forwarding and masquerading
    subprocess.run(["sudo", "sysctl", "-w", "net.ipv4.ip_forward=1"])
    subprocess.run(["sudo", "iptables", "-t", "nat", "-A", "POSTROUTING", "-o", "eth0", "-j", "MASQUERADE"])

def generate_qr_code(ssid, password):
    # Generate Wi-Fi QR code
    wifi_config = f"WIFI:S:{ssid};T:WPA;P:{password};;"
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(wifi_config)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save("wifi_qr.png")
    os.system("xdg-open wifi_qr.png")  # Opens the image with default viewer

if __name__ == "__main__":
    enable_hotspot()
    generate_qr_code(ssid, password)