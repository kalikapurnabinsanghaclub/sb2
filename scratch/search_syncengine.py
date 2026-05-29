import os

for root, dirs, files in os.walk("c:\\Users\\sourav pc\\Desktop\\kalikapur"):
    if "node_modules" in root or ".git" in root or "dist" in root:
        continue
    for file in files:
        if file.endswith(".js") or file.endswith(".html"):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            if "class LocalSync" in content or "LocalSync =" in content or "localStorage.getItem" in content:
                print(f"Found in {path}")
