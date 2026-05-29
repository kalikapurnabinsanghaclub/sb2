import os

for root, dirs, files in os.walk("c:\\Users\\sourav pc\\Desktop\\kalikapur"):
    if "node_modules" in root or ".git" in root or "dist" in root:
        continue
    for file in files:
        if file.endswith(".html"):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            if "on-stage-judge-scores" in content:
                print(f"Found in {path}")
