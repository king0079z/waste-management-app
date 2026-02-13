# ⚡ Quick Start - MongoDB Migration

## 🚀 Fast Track Migration (5 Minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure MongoDB
Create `.env` file (copy from `.env.example`):
```env
DATABASE_TYPE=mongodb
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=waste_management
```

### Step 3: Verify MongoDB is Running
```bash
# Windows
mongosh

# Or check service
net start MongoDB
```

### Step 4: Run Migration
```bash
npm run migrate:mongo
```

### Step 5: Verify Success
- ✅ Check console output for "Migration completed successfully"
- ✅ Check `backups/` folder for backup files
- ✅ Start your application: `npm start`

## 🎯 That's It!

Your data is now in MongoDB. The application will automatically use MongoDB when `DATABASE_TYPE=mongodb` is set.

## 📋 What Happens During Migration?

1. **Automatic Backup** - Your `data.json` is backed up automatically
2. **Data Migration** - All collections are migrated to MongoDB
3. **Index Creation** - Performance indexes are created automatically
4. **Validation** - Data integrity is verified
5. **Logging** - Complete migration log is saved

## 🔄 Need to Rollback?

```bash
# Restore from backup
node backup-utility.js restore backups/data-json-backup-YYYY-MM-DD.json

# Change .env back to JSON
DATABASE_TYPE=json
```

## ❓ Troubleshooting

**MongoDB not connecting?**
- Make sure MongoDB is running: `mongosh`
- Check connection string in `.env`

**Migration failed?**
- Check `backups/migration-log-*.txt` for details
- Verify your `data.json` file is valid JSON
- Ensure MongoDB has enough disk space

---

For detailed information, see `MONGODB_MIGRATION_GUIDE.md`
