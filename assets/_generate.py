"""生成 OutfitIQ 图标：白底 + 紫色品牌色块 + 'IQ' 字样。"""
import struct
import zlib
import os

def png(width, height, bg=(255, 255, 255), fg=(91, 91, 214)):
    pixels = []
    cx, cy = width / 2, height / 2

    def in_q(x, y):
        # 大写 Q 的圆 + 尾巴
        r_outer = width * 0.32
        r_inner = r_outer - width * 0.06
        dx, dy = x - cx + width * 0.05, y - cy  # 整体左移一点点
        dist = (dx * dx + dy * dy) ** 0.5
        if r_inner < dist < r_outer and dy > -width * 0.05:
            return True
        # Q 的尾巴（右下斜线）
        if dx > r_inner * 0.5 and dy > r_inner * 0.5 and abs(dx - dy) < width * 0.04:
            return True
        return False

    def in_i(x, y):
        # I 字母：竖条 + 上下短横
        x_shift = cx + width * 0.18  # I 在右侧
        bar_w = width * 0.06
        bar_h_top = width * 0.04
        bar_h_mid = width * 0.28
        bar_h_bot = width * 0.04
        # 上横
        if abs(x - x_shift) < bar_w and abs(y - (cy - bar_h_mid/2 - bar_h_top/2)) < bar_h_top / 2:
            return True
        # 中竖
        if abs(x - x_shift) < bar_w / 2 and abs(y - cy) < bar_h_mid / 2:
            return True
        # 下横
        if abs(x - x_shift) < bar_w and abs(y - (cy + bar_h_mid/2 + bar_h_bot/2)) < bar_h_bot / 2:
            return True
        return False

    for y in range(height):
        row = b''
        for x in range(width):
            if in_q(x, y) or in_i(x, y):
                r, g, b = fg
            else:
                r, g, b = bg
            row += bytes([r, g, b])
        pixels.append(b'\x00' + row)

    raw = b''.join(pixels)

    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    idat = zlib.compress(raw, 9)
    return sig + chunk(b'IHDR', ihdr) + chunk(b'IDAT', idat) + chunk(b'IEND', b'')


base = os.path.dirname(__file__)

# 主图标
with open(os.path.join(base, 'icon.png'), 'wb') as f:
    f.write(png(1024, 1024))

# 自适应图标前景（透明背景改为白底）
with open(os.path.join(base, 'adaptive-icon.png'), 'wb') as f:
    f.write(png(1024, 1024))

# 启动屏
with open(os.path.join(base, 'splash.png'), 'wb') as f:
    f.write(png(1242, 2436))

# 工具栏图标
with open(os.path.join(base, 'favicon.png'), 'wb') as f:
    f.write(png(48, 48))

print('done')