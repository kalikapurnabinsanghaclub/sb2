import os

file_path = r"c:\Users\sourav pc\Desktop\kalikapur\index.html"

# Load the file content with surrogateescape for safety
with open(file_path, "r", encoding="utf-8", errors="surrogateescape") as f:
    content = f.read()

# 1. Update Toast title/text color contrast
toast_style_target = """    .toast-title {
      font-weight: 800;
      font-size: 0.9rem;
      color: #F8FAFC;
    }

    .toast-text {
      font-size: 0.8rem;
      color: #E2E8F0;
      margin-top: 2px;
    }"""

toast_style_replacement = """    .toast-title {
      font-weight: 800;
      font-size: 0.9rem;
      color: #1E293B;
    }

    .toast-text {
      font-size: 0.8rem;
      color: #64748B;
      margin-top: 2px;
    }"""

# 2. Update address label color
label_target = """          <label
            style="display: block; font-weight: 700; color: #F8FAFC; margin-bottom: 8px; font-size: 0.9rem;">Address for
            Certificate</label>"""

label_replacement = """          <label
            style="display: block; font-weight: 700; color: #000; margin-bottom: 8px; font-size: 0.9rem;">Address for
            Certificate</label>"""

# 3. Replace alert calls inside processDonation()
donation_alert_target = """      if (!amount || amount < 100) {
        alert("❌ Please enter a valid amount (minimum ₹100)");
        return;
      }
      if (!name) {
        alert("❌ Please enter your name");
        return;
      }
      if (!email) {
        alert("❌ Please enter your email");
        return;
      }

      document.getElementById("successMsg").classList.remove("hidden");

      if (amount >= 2000) {
        setTimeout(() => {
          generateDonationCertificate(name, amount, email, phone, address, pan);
          closeDonationForm();
          document.getElementById("successMsg").classList.add("hidden");
        }, 1500);
      } else {
        alert(`✅ Thank you for your donation of ₹${amount}! A receipt has been sent to ${email}`);
        closeDonationForm();
        document.getElementById("successMsg").classList.add("hidden");
      }"""

donation_alert_replacement = """      if (!amount || amount < 100) {
        showToast("Invalid Amount", "Please enter a valid amount (minimum ₹100)", "⚠️");
        return;
      }
      if (!name) {
        showToast("Name Required", "Please enter your name", "⚠️");
        return;
      }
      if (!email) {
        showToast("Email Required", "Please enter your email", "⚠️");
        return;
      }

      document.getElementById("successMsg").classList.remove("hidden");

      if (amount >= 2000) {
        setTimeout(() => {
          generateDonationCertificate(name, amount, email, phone, address, pan);
          closeDonationForm();
          document.getElementById("successMsg").classList.add("hidden");
        }, 1500);
      } else {
        showToast("Thank You!", `Thank you for your donation of ₹${amount}! A receipt has been sent to ${email}`, "💖");
        closeDonationForm();
        document.getElementById("successMsg").classList.add("hidden");
      }"""

replacements = [
    (toast_style_target, toast_style_replacement, "Toast styles contrast update"),
    (label_target, label_replacement, "Donation form address label color update"),
    (donation_alert_target, donation_alert_replacement, "Replacing alert() with showToast() in processDonation()")
]

all_success = True
for target, replacement, desc in replacements:
    if target in content:
        content = content.replace(target, replacement)
        print(f"SUCCESS: {desc}")
    else:
        print(f"ERROR: Target string for '{desc}' was not found in index.html!")
        all_success = False

if all_success:
    with open(file_path, "w", encoding="utf-8", errors="surrogateescape") as f:
        f.write(content)
    print("SUCCESS: All updates written successfully to index.html!")
else:
    print("WARNING: No changes written because one or more target strings were not found. Please review the errors above.")
