# 🔧 Port Already in Use - Quick Fix

## ❌ Error: `EADDRINUSE: address already in use :::3000`

This means port 3000 (or 8080) is already being used by another process, likely a previous instance of your server.

## 🚀 Quick Fix

### Option 1: Kill the Port (Recommended)

I've created a helper script for you:

```bash
kill-port.bat
```

Just double-click it or run:
```bash
kill-port.bat
```

This will automatically find and kill any process using port 3000 or 8080.

### Option 2: Manual Fix

1. **Find the process**:
   ```bash
   netstat -ano | findstr :3000
   ```

2. **Kill the process** (replace PID with the number you found):
   ```bash
   taskkill /F /PID <PID>
   ```

3. **Or kill all Node processes**:
   ```bash
   taskkill /F /IM node.exe
   ```

### Option 3: Use Different Port

Update `.env` file to use a different port:
```env
PORT=8081
```

Then restart the application.

## ✅ After Fixing

Once the port is free, restart your application:

```bash
start-application.bat
```

## 🔍 Prevention

The batch file now automatically checks and attempts to free the port before starting. If it still fails, run `kill-port.bat` manually first.

---

**Quick Solution**: Run `kill-port.bat` then restart `start-application.bat`
