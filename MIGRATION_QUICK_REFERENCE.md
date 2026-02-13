# ⚡ MongoDB Migration - Quick Reference

## 🚀 Complete Migration Process (3 Steps)

### 1️⃣ Run Migration
```bash
npm run migrate:mongo
```

### 2️⃣ Verify Migration
```bash
npm run verify:migration
```

### 3️⃣ Check Results
Look for: `✅ ALL DATA SUCCESSFULLY MIGRATED - ZERO DATA LOSS`

## 📋 Pre-Migration Checklist

- [ ] MongoDB is installed and running
- [ ] `.env` file configured with MongoDB settings
- [ ] `data.json` file exists and is valid
- [ ] Backup created (automatic, but manual backup recommended)

## 🔧 Configuration Required

Create `.env` file:
```env
DATABASE_TYPE=mongodb
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=waste_management
```

## ✅ Post-Migration Checklist

- [ ] Migration completed without errors
- [ ] Verification passed (all data matches)
- [ ] Application starts successfully
- [ ] Data accessible in application
- [ ] Backup files stored safely

## 🔍 Quick Verification Commands

```bash
# Full verification
npm run verify:migration

# Check MongoDB directly
mongosh
use waste_management
db.users.countDocuments()
db.bins.countDocuments()
```

## 🆘 Troubleshooting

**Migration fails?**
- Check MongoDB is running: `mongosh`
- Verify `.env` configuration
- Check `data.json` is valid JSON

**Verification shows missing data?**
- Re-run migration (safe, uses upsert)
- Check migration log: `backups/migration-log-*.txt`
- Verify MongoDB has enough space

## 📊 What Gets Migrated

✅ All collections:
- Users, Bins, Routes, Collections
- Complaints, Alerts, Sensors
- System Logs, Pending Registrations
- Driver Locations, Analytics

## 🎯 Success = Zero Data Loss

When verification shows:
```
✅ ALL DATA SUCCESSFULLY MIGRATED - ZERO DATA LOSS
```

You're done! All data is safely in MongoDB.

---

**For detailed instructions, see `MONGODB_MIGRATION_GUIDE.md`**
**For verification details, see `HOW_TO_VERIFY_MIGRATION.md`**
