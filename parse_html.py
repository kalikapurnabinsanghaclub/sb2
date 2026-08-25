import sys; sys.stdout.reconfigure(encoding='utf-8')
from html.parser import HTMLParser

class MyHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_script = False
        self.in_style = False
        self.text_nodes = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() == 'script':
            self.in_script = True
        elif tag.lower() == 'style':
            self.in_style = True

    def handle_endtag(self, tag):
        if tag.lower() == 'script':
            self.in_script = False
        elif tag.lower() == 'style':
            self.in_style = False

    def handle_data(self, data):
        if not self.in_script and not self.in_style:
            clean_data = data.strip()
            if clean_data:
                self.text_nodes.append((self.getpos(), clean_data))

with open('KNSDC-Participant.html', 'r', encoding='utf-8') as f:
    html = f.read()

parser = MyHTMLParser()
parser.feed(html)

print(f"Found {len(parser.text_nodes)} text nodes outside script/style:")
for pos, txt in parser.text_nodes:
    if 'trackingMaps' in txt or 'win.document.close' in txt:
        print(f"Line {pos[0]}, Col {pos[1]}: {txt[:100]}...")
