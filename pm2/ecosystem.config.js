module.exports = {
  apps: [
    {
      name: 'jeca-api',
      script: 'dist/server.js',
      cwd: './backend',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
