module.exports = {
  primary: {
    host: process.env.PRIMARY_DB_HOST || 'localhost',
    port: process.env.PRIMARY_DB_PORT || 5432,
    database: 'twitter_primary',
    user: 'postgres',
    password: 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  standby: {
    host: process.env.STANDBY_DB_HOST || 'localhost',
    port: process.env.STANDBY_DB_PORT || 5433,
    database: 'twitter_standby',
    user: 'postgres',
    password: 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  backup: {
    interval: 300000, // 5 minutes
    walInterval: 30000, // 30 seconds
    retentionDays: 30,
    s3Bucket: 'twitter-dr-backups',
    crossRegion: true
  }
};
