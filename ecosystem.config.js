module.exports = {
  apps: [
    {
      name: 'isp-backend',
      cwd: '/var/www/ispbilling/backend',
      script: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'isp-frontend',
      cwd: '/var/www/ispbilling/frontend',
      script: 'node_modules/.bin/next',
      args: 'start -p 3001',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'isp-customer',
      cwd: '/var/www/ispbilling/frontend-customer',
      script: 'node_modules/.bin/next',
      args: 'start -p 3002',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
