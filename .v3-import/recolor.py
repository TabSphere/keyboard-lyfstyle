from pathlib import Path
from PIL import Image
import base64, json

root = Path('.')
maps = json.loads(Path('.v3-import/maps.json').read_text())
old_ink = (17, 17, 20, 255)
new_ink = (27, 25, 22, 255)
new_accent = (229, 96, 74, 255)

def mapped_image(name):
    source = Image.open(root / 'assets' / name).convert('RGBA')
    raw = base64.b64decode(maps[name])
    table = {tuple(raw[i:i+4]): tuple(raw[i+4:i+8]) for i in range(0, len(raw), 8)}
    output = Image.new('RGBA', source.size)
    output.putdata([table[pixel] for pixel in source.getdata()])
    output.save(root / 'assets' / name, optimize=True)

for name in ('icon.png', 'favicon.png'):
    mapped_image(name)

for name in ('splash-icon.png', 'android-icon-foreground.png'):
    source = Image.open(root / 'assets' / name).convert('RGBA')
    output = Image.new('RGBA', source.size, new_accent)
    output.putalpha(source.getchannel('A'))
    output.save(root / 'assets' / name, optimize=True)

Image.new('RGBA', (1024, 1024), new_ink).save(root / 'assets' / 'android-icon-background.png', optimize=True)
