"""生成 OutfitIQ 图标：极简紫色背景 + 穿衣镜与人影轮廓。"""
import struct
import zlib
import os

def png(width, height, bg=(91, 91, 214), fg=(255, 255, 255)):
    pixels = []
    cx, cy = width / 2, height / 2

    def in_mirror(x, y):
        # 1. 穿衣镜框架（长椭圆/胶囊形）
        mw = width * 0.4
        mh = height * 0.65
        dx = (x - cx) / (mw / 2)
        dy = (y - cy) / (mh / 2)

        # 胶囊形逻辑：上下是圆弧，中间是直线
        is_frame = False
        inner_shrink = 0.92 # 边框厚度

        # 外部轮廓
        dist_sq = dx*dx + dy*dy
        if dist_sq < 1.0:
            # 内部掏空，只留细边框和镜面
            if dist_sq > inner_shrink:
                is_frame = True # 边框

            # 2. 人影轮廓（简化剪影）
            # 头部
            hx, hy = cx, cy - height * 0.18
            hr = width * 0.08
            h_dist = ((x - hx)**2 + (y - hy)**2)**0.5
            if h_dist < hr: return True

            # 身体（梯形/三角形感）
            # 肩膀
            if abs(y - (cy - height*0.05)) < height*0.02 and abs(x - cx) < width*0.12:
                return True
            # 躯干
            if (cy - height*0.05) < y < (cy + height*0.2):
                # 稍微收腰的效果
                waist_w = width * (0.12 - 0.04 * abs(y - cy) / (height*0.2))
                if abs(x - cx) < waist_w:
                    return True

        return is_frame

    for y in range(height):
        row = b''
        for x in range(width):
            if in_mirror(x, y):
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

# 生成预览
img_data = png(1024, 1024)
with open(os.path.join(base, 'icon.png'), 'wb') as f:
    f.write(img_data)
with open(os.path.join(base, 'adaptive-icon.png'), 'wb') as f:
    f.write(img_data)
with open(os.path.join(base, 'splash.png'), 'wb') as f:
    f.write(img_data)

print('Mirror Silhouette Icon generated.')
