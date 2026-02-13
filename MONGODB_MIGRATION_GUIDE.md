# 🚀 MongoDB Migration Guide - World-Class Implementation

This guide provides step-by-step instructions for migrating your waste management system from JSON file storage to MongoDB with **zero data loss** and **world-class reliability**.

## 📋 Prerequisites

1. **MongoDB Installed**: Ensure MongoDB is installed and running on your system
   - Check if MongoDB is running: `mongosh` or `mongo` (depending on version)
   - Default connection: `mongodb://localhost:27017`

2. **Node.js Dependencies**: Install required packages
   ```bash
   npm install
   ```

3. **Backup Your Data**: Always backup before migration!
   ```bash
   npm run backup:json
   ```

## 🔧 Configuration

### Step 1: Create `.env` File

Copy `.env.example` to `.env` and configure MongoDB:

```env
# Set database type to MongoDB
DATABASE_TYPE=mongodb
DB_TYPE=mongodb

# MongoDB Connection (default for local installation)
MONGODB_URI=mongodb://localhost:27017
MONGODB_URL=mongodb://localhost:27017
MONGODB_DATABASE=waste_management
```

### Step 2: Verify MongoDB Connection

Test your MongoDB connection:

```bash
# Using mongosh (MongoDB Shell)
mongosh

# Or test connection in Node.js
node -e "const {MongoClient} = require('mongodb'); (async() => { const client = new MongoClient('mongodb://localhost:27017'); await client.connect(); console.log('✅ Connected!'); await client.close(); })()"
```

## 🚀 Migration Process

### Step 1: Create Backup

**CRITICAL**: Always backup your data before migration!

```bash
# Backup JSON file
npm run backup:json

# Or backup everything
npm run backup:all
```

This creates a timestamped backup in the `backups/` directory.

### Step 2: Run Migration

Execute the migration script:

```bash
npm run migrate:mongo
```

The migration script will:
1. ✅ Create automatic backup of `data.json`
2. ✅ Connect to MongoDB
3. ✅ Create optimized indexes
4. ✅ Migrate all collections:
   - Users
   - Bins
   - Routes
   - Collections
   - Complaints
   - Alerts
   - Sensors
   - System Logs
   - Driver Locations
   - Analytics
5. ✅ Validate data integrity
6. ✅ Generate migration report

### Step 3: Verify Migration

The migration script automatically validates:
- Document counts match
- All collections migrated
- Data integrity verified

Check the migration log in `backups/migration-log-*.txt` for details.

### Step 4: Update Application

Your application will automatically use MongoDB when:
- `DATABASE_TYPE=mongodb` is set in `.env`
- MongoDB connection is successful

The `database-manager.js` handles the switch automatically.

## 📊 Migration Features

### ✅ Zero Data Loss
- Automatic backups before migration
- Upsert operations (no duplicates)
- Validation after migration
- Rollback capability

### ✅ Performance Optimized
- Bulk write operations
- Indexed collections
- Connection pooling
- Efficient queries

### ✅ Production Ready
- Error handling
- Transaction safety
- Connection management
- Logging and monitoring

## 🔍 Data Structure Mapping

| JSON Structure | MongoDB Collection | Indexes |
|---------------|-------------------|---------|
| `users[]` | `users` | id (unique), username (unique), email, type |
| `bins[]` | `bins` | id (unique), location (text), lat/lng (2d), status |
| `routes[]` | `routes` | id (unique), driverId, status |
| `collections[]` | `collections` | id (unique), binId, driverId, timestamp |
| `complaints[]` | `complaints` | id (unique), status, createdAt |
| `alerts[]` | `alerts` | id (unique), type, status, timestamp |
| `sensors[]` | `sensors` | imei (unique), binId |
| `driverLocations{}` | `driverLocations` | key (unique) |
| `analytics{}` | `analytics` | key (unique) |

## 🛠️ Backup & Restore

### Create Backups

```bash
# Backup JSON file only
npm run backup:json

# Backup MongoDB only
npm run backup:mongo

# Backup both
npm run backup:all

# List all backups
npm run backup:list
```

### Restore from Backup

```bash
# Restore from JSON backup
node backup-utility.js restore backups/data-json-backup-YYYY-MM-DD.json

# Restore from MongoDB backup
node backup-utility.js restore backups/mongodb-backup-YYYY-MM-DD.json
```

## 🔄 Rollback Procedure

If you need to rollback to JSON storage:

1. **Stop the application**
2. **Restore JSON backup**:
   ```bash
   node backup-utility.js restore backups/data-json-backup-YYYY-MM-DD.json
   ```
3. **Update `.env`**:
   ```env
   DATABASE_TYPE=json
   ```
4. **Restart application**

## 🐛 Troubleshooting

### MongoDB Connection Failed

**Error**: `Failed to connect to MongoDB`

**Solutions**:
1. Verify MongoDB is running:
   ```bash
   # Windows
   net start MongoDB
   
   # Linux/Mac
   sudo systemctl start mongod
   ```

2. Check connection string in `.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017
   ```

3. Test connection manually:
   ```bash
   mongosh mongodb://localhost:27017
   ```

### Migration Validation Failed

**Error**: Document counts don't match

**Solutions**:
1. Check migration log for details
2. Verify source data integrity
3. Re-run migration (it's safe - uses upsert)
4. Check MongoDB logs for errors

### Duplicate Key Errors

**Error**: `E11000 duplicate key error`

**Solution**: The migration uses upsert operations, so this shouldn't occur. If it does:
1. Check for duplicate IDs in source data
2. Clean MongoDB collections:
   ```bash
   mongosh
   use waste_management
   db.users.deleteMany({})
   # Repeat for other collections
   ```
3. Re-run migration

## 📈 Performance Tips

1. **Indexes**: All critical fields are indexed automatically
2. **Bulk Operations**: Migration uses bulk writes for efficiency
3. **Connection Pooling**: Configured for optimal performance
4. **Query Optimization**: Use indexed fields in queries

## 🔒 Security Considerations

1. **Authentication**: For production, use MongoDB authentication:
   ```env
   MONGODB_URI=mongodb://username:password@localhost:27017/waste_management?authSource=admin
   ```

2. **Network Security**: Use firewall rules for MongoDB port (27017)

3. **Backup Encryption**: Consider encrypting backup files

4. **Environment Variables**: Never commit `.env` file to version control

## ✅ Post-Migration Checklist

- [ ] Migration completed successfully
- [ ] Validation passed (all document counts match)
- [ ] Backup created and stored safely
- [ ] Application starts with MongoDB
- [ ] All features working correctly
- [ ] Performance acceptable
- [ ] Monitoring in place

## 📞 Support

If you encounter issues:

1. Check migration log: `backups/migration-log-*.txt`
2. Review MongoDB logs
3. Verify `.env` configuration
4. Test MongoDB connection manually
5. Check backup files for data integrity

## 🎉 Success Indicators

You'll know the migration was successful when:

- ✅ Migration script completes without errors
- ✅ Validation shows all document counts match
- ✅ Application starts and connects to MongoDB
- ✅ All data is accessible through the application
- ✅ No data loss detected

---

**Remember**: Always backup before migration! The migration script creates automatic backups, but having an additional manual backup is recommended.
