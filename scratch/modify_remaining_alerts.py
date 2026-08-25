import os

file_path = r"c:\Users\sourav pc\Desktop\kalikapur\index.html"

# Load the file content with surrogateescape for safety
with open(file_path, "r", encoding="utf-8", errors="surrogateescape") as f:
    content = f.read()

# Replacements list (Target, Replacement, Description)
replacements = [
    (
        'if (results.length === 0) { alert(\'No results available yet.\'); return; }',
        'if (results.length === 0) { showToast("No Results", "No results available yet.", "⚠️"); return; }',
        "PDF Results: No results alert"
    ),
    (
        'if (pages.length === 0) { alert(\'No results available yet.\'); return; }',
        'if (pages.length === 0) { showToast("No Results", "No results available yet.", "⚠️"); return; }',
        "PDF Category Sheet: No results alert"
    ),
    (
        'if (promoted.length === 0) { alert(\'No promotion data available yet.\'); return; }',
        'if (promoted.length === 0) { showToast("No Promotion Data", "No promotion data available yet.", "⚠️"); return; }',
        "PDF Promotion: No promotion data alert"
    ),
    (
        'if (!user || !pass) {\n        alert("Please enter credentials");\n        return;\n      }',
        'if (!user || !pass) {\n        showToast("Credentials Required", "Please enter your email and password.", "⚠️");\n        return;\n      }',
        "Login: Empty credentials alert"
    ),
    (
        'if (!found) {\n          alert("Invalid email or password. Please try again.");\n          return;\n        }',
        'if (!found) {\n          showToast("Authentication Failed", "Invalid email or password. Please try again.", "❌");\n          return;\n        }',
        "Login: Invalid credentials alert"
    ),
    (
        'alert("Welcome back, " + found.name);',
        'showToast("Welcome Back!", "Welcome back, " + found.name, "👋");',
        "Login: Welcome back alert"
    ),
    (
        'alert("Success! Launching " + selectedRole + " portal...");',
        'showToast("Login Success", "Launching " + selectedRole + " portal...", "🚀");',
        "Login: Staff success alert"
    ),
    (
        'if (!eventId) { alert("Please select an event."); return; }',
        'if (!eventId) { showToast("Event Selection", "Please select an event to register.", "⚠️"); return; }',
        "Signup: Select event alert"
    ),
    (
        "if (!tc.checked) { alert('You must agree to the Terms & Conditions'); return; }",
        'if (!tc.checked) { showToast("Terms & Conditions", "You must agree to the Terms & Conditions.", "⚠️"); return; }',
        "Signup: T&C agreement alert"
    ),
    (
        "alert(`Please fill: ${f.label}`);",
        'showToast("Required Field", `Please fill in: ${f.label}`, "⚠️");',
        "Signup: Required field alert"
    ),
    (
        "if (!name) { alert('Please fill your Name!'); return; }",
        'if (!name) { showToast("Name Required", "Please fill in your Name!", "⚠️"); return; }',
        "Signup: Empty name alert"
    )
]

all_success = True
for target, replacement, desc in replacements:
    if target in content:
        content = content.replace(target, replacement)
        print(f"SUCCESS: {desc}")
    else:
        # Some targets might have slightly different whitespace, let's normalize check or report
        print(f"ERROR: Target string for '{desc}' was not found in index.html!")
        all_success = False

if all_success:
    with open(file_path, "w", encoding="utf-8", errors="surrogateescape") as f:
        f.write(content)
    print("SUCCESS: All remaining alerts updated successfully in index.html!")
else:
    print("WARNING: No changes written due to mismatched targets. Let's inspect the code lines precisely.")
