import sys

def main():
    filename = "KNSDC-Referee.html"
    print(f"Reading {filename}...")
    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()

    target = "function handleMatchSetup(event) {"
    first_idx = content.find(target)
    if first_idx == -1:
        print("Error: Could not find first handleMatchSetup")
        sys.exit(1)
        
    second_idx = content.find(target, first_idx + len(target))
    if second_idx == -1:
        print("Error: Could not find second handleMatchSetup")
        sys.exit(1)

    print(f"First occurrence index: {first_idx}, Second occurrence index: {second_idx}")
    
    # Slice the file: keep everything before the first handleMatchSetup,
    # and everything starting from the second handleMatchSetup.
    new_content = content[:first_idx] + content[second_idx:]
    
    with open(filename, "w", encoding="utf-8") as f:
        f.write(new_content)
        
    print("Cleaned file successfully!")

if __name__ == "__main__":
    main()
