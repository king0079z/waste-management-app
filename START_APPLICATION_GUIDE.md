# 🚀 Application Startup Guide

This guide explains how to use the batch files to start your application with MongoDB migration.

## 📋 Available Batch Files

### 1. `start-application.bat` (Recommended)
**Full-featured startup script** - Does everything automatically:
- ✅ Checks Node.js and npm
- ✅ Verifies configuration
- ✅ Checks MongoDB connection
- ✅ Installs dependencies if needed
- ✅ Runs migration
- ✅ Verifies migration
- ✅ Starts application

**Usage:**
```bash
start-application.bat
```

**Best for:** First-time setup or when you want full automation

---

### 2. `start-application-simple.bat`
**Simple startup script** - Just starts the application:
- ✅ Checks Node.js
- ✅ Installs dependencies if needed
- ✅ Starts application

**Usage:**
```bash
start-application-simple.bat
```

**Best for:** When migration is already done and you just want to start the app

---

### 3. `migrate-and-start.bat`
**Migration-only script** - Runs migration and verification:
- ✅ Checks Node.js
- ✅ Installs dependencies if needed
- ✅ Runs migration
- ✅ Verifies migration
- ❌ Does NOT start application

**Usage:**
```bash
migrate-and-start.bat
```

**Best for:** When you want to run migration separately before starting the app

---

## 🎯 Quick Start

### First Time Setup:
```bash
# Double-click or run:
start-application.bat
```

This will:
1. Check all prerequisites
2. Run migration automatically
3. Verify migration
4. Start your application

### Daily Use (After Migration):
```bash
# Double-click or run:
start-application-simple.bat
```

This will just start the application (assumes migration already done).

---

## 📝 Step-by-Step Process

### Using `start-application.bat`:

1. **Double-click** `start-application.bat` or run from command prompt
2. **Script checks:**
   - Node.js installation
   - npm installation
   - Configuration file (.env)
   - MongoDB connection
   - Dependencies

3. **Migration runs automatically:**
   - Creates backup
   - Migrates all data
   - Validates migration
   - Verifies data integrity

4. **Application starts:**
   - Opens on http://localhost:8080
   - Ready to use!

---

## ⚙️ Configuration

Before first run, ensure:

1. **MongoDB is installed and running**
   ```bash
   # Check if MongoDB is running
   mongosh
   ```

2. **`.env` file is configured**
   ```env
   DATABASE_TYPE=mongodb
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DATABASE=waste_management
   ```

3. **Node.js is installed**
   - Download from https://nodejs.org/
   - Version 16+ required

---

## 🔍 What Each Script Does

### `start-application.bat` (Full Process):
```
[1/6] Check Node.js ✓
[2/6] Check npm ✓
[3/6] Check configuration ✓
[4/6] Check MongoDB connection ✓
[5/6] Check dependencies ✓
[6/6] Run migration ✓
[BONUS] Verify migration ✓
Starting Application...
```

### `start-application-simple.bat` (Quick Start):
```
Check Node.js ✓
Check dependencies ✓
Starting Application...
```

### `migrate-and-start.bat` (Migration Only):
```
Check Node.js ✓
Check dependencies ✓
Run migration ✓
Verify migration ✓
Done!
```

---

## ⚠️ Troubleshooting

### MongoDB Connection Failed
**Error:** `MongoDB connection failed`

**Solution:**
1. Start MongoDB service:
   ```bash
   net start MongoDB
   ```
2. Or start MongoDB manually
3. Verify connection string in `.env`

### Node.js Not Found
**Error:** `Node.js is not installed`

**Solution:**
1. Install Node.js from https://nodejs.org/
2. Restart command prompt
3. Verify: `node --version`

### Migration Fails
**Error:** `Migration completed with errors`

**Solution:**
1. Check migration log: `backups/migration-log-*.txt`
2. Verify MongoDB is running
3. Check `.env` configuration
4. Re-run migration manually: `npm run migrate:mongo`

### Dependencies Installation Fails
**Error:** `Failed to install dependencies`

**Solution:**
1. Check internet connection
2. Clear npm cache: `npm cache clean --force`
3. Delete `node_modules` and `package-lock.json`
4. Run: `npm install`

---

## 🎯 Recommended Workflow

### First Time:
```bash
start-application.bat
```
- Full setup and migration
- Takes longer but ensures everything is correct

### Daily Use:
```bash
start-application-simple.bat
```
- Quick startup
- Assumes migration already done

### After Data Changes:
```bash
migrate-and-start.bat
```
- Re-run migration
- Verify data integrity
- Then use `start-application-simple.bat`

---

## 📊 Script Output

### Successful Migration:
```
[OK] Node.js found
[OK] npm found
[OK] .env file exists
[OK] MongoDB connection successful
[OK] Dependencies found
[OK] Migration completed successfully
[OK] Migration verification passed
Starting Application...
```

### With Warnings:
```
[WARNING] MongoDB connection failed
Continue anyway? (y/n):
[WARNING] Migration completed with errors
Continue to start application? (y/n):
```

---

## 💡 Pro Tips

1. **Use full script first time**: `start-application.bat` ensures everything is set up
2. **Use simple script daily**: `start-application-simple.bat` for faster startup
3. **Check logs**: If issues occur, check `backups/` folder for logs
4. **Keep MongoDB running**: Ensure MongoDB service is running before starting
5. **Verify migration**: Always check verification results after migration

---

## 🔄 Manual Alternative

If you prefer manual control:

```bash
# 1. Run migration
npm run migrate:mongo

# 2. Verify migration
npm run verify:migration

# 3. Start application
npm start
```

---

## ✅ Success Indicators

You'll know everything worked when:

- ✅ All checks pass
- ✅ Migration shows "ALL DATA VERIFIED - ZERO DATA LOSS"
- ✅ Verification shows "ALL DATA SUCCESSFULLY MIGRATED"
- ✅ Application starts on http://localhost:8080
- ✅ No errors in console

---

**Remember:** The batch files automate everything for you, but you can always run commands manually if needed!
