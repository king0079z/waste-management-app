# Create GitHub repo for this project

## 1. Open the “new repo” page

Click this link (it opens GitHub with the form already set for this project):

**https://github.com/new?name=waste-management-app&description=Waste+Management+System+with+WebSockets+and+MongoDB**

Or go to **https://github.com/new** and fill the form manually.

---

## 2. Fill the form

| Field | Use this |
|-------|----------|
| **Repository name** | `waste-management-app` (or any name you like) |
| **Description** | `Waste Management System with WebSockets and MongoDB` (optional) |
| **Public** | Leave **Public** selected |
| **Add a README** | Leave **unchecked** (you already have code) |
| **Add .gitignore** | Leave **unchecked** (you already have one) |
| **Choose a license** | None |

Click **Create repository**.

---

## 3. Push your local project to the new repo

GitHub will show “quick setup” commands. Use these in PowerShell (replace `YOUR_USERNAME` with your GitHub username):

```powershell
cd "c:\Users\Mohamed\Desktop\New folder (28)\wast Ap"
git remote add origin https://github.com/YOUR_USERNAME/waste-management-app.git
git branch -M main
git push -u origin main
```

If Git asks for credentials:
- **Username:** your GitHub username  
- **Password:** a **Personal Access Token** (not your GitHub password)  
  Create one: GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)** → **Generate new token**. Give it `repo` scope.

---

After this, your code will be on GitHub and you can connect the repo to Render (see **RENDER_DEPLOY_NOW.md**).
