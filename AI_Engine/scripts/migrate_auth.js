const { sql, pool, poolConnect } = require('../src/config/db');

const migrate = async () => {
    try {
        console.log("⏳ Connecting to SQL Server...");
        await poolConnect;
        const request = pool.request();

        console.log("⏳ Adding ResetPin and ResetPinExpires columns to dbo.Users...");
        const sqlQuery = `
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = 'ResetPin')
            BEGIN
                ALTER TABLE [dbo].[Users] ADD [ResetPin] NVARCHAR(10) NULL;
            END

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = 'ResetPinExpires')
            BEGIN
                ALTER TABLE [dbo].[Users] ADD [ResetPinExpires] DATETIME2 NULL;
            END
        `;

        await request.query(sqlQuery);
        console.log("✅ Migration completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    }
};

migrate();
