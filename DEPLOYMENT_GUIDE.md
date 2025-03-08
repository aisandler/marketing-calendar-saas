# Deployment Guide: Marketing Calendar SaaS

This guide provides detailed instructions for deploying the Marketing Calendar SaaS application to production environments. It covers all necessary steps from building the application to configuring the production environment.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
- [Building for Production](#building-for-production)
- [Supabase Setup](#supabase-setup)
- [Vercel Deployment](#vercel-deployment)
- [Netlify Deployment](#netlify-deployment)
- [Docker Deployment](#docker-deployment)
- [Environment Variables](#environment-variables)
- [Custom Domain Setup](#custom-domain-setup)
- [SSL Configuration](#ssl-configuration)
- [Post-Deployment Verification](#post-deployment-verification)
- [Monitoring and Logging](#monitoring-and-logging)
- [Backup and Recovery](#backup-and-recovery)
- [Scaling Considerations](#scaling-considerations)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying the Marketing Calendar SaaS application, ensure you have:

1. A Supabase account with a project set up
2. Access to a hosting platform (Vercel, Netlify, or your own server)
3. A domain name (optional, but recommended for production)
4. Node.js v16 or later installed on your local machine
5. Git installed on your local machine

## Deployment Options

The Marketing Calendar SaaS application can be deployed in several ways:

1. **Static Site Hosting** (Recommended)
   - Vercel
   - Netlify
   - GitHub Pages
   - AWS S3 + CloudFront

2. **Container-Based Deployment**
   - Docker + any cloud provider
   - Kubernetes

3. **Traditional Hosting**
   - VPS or dedicated server
   - Shared hosting with Node.js support

This guide will focus primarily on the recommended static site hosting options, as they provide the best balance of simplicity, performance, and cost.

## Building for Production

Before deploying, you need to build the application for production:

1. Clone the repository (if you haven't already):
   ```bash
   git clone https://github.com/aisandler/marketing-calendar-saas.git
   cd marketing-calendar-saas
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a production build:
   ```bash
   npm run build
   ```

4. The build output will be in the `dist` directory, which contains static files ready for deployment.

## Supabase Setup

### Production Database Setup

1. Create a new Supabase project specifically for production:
   - Go to [https://app.supabase.com](https://app.supabase.com)
   - Click "New Project"
   - Enter a name (e.g., "Marketing Calendar Production")
   - Choose a strong database password
   - Select a region close to your target users

2. Set up the database schema:
   - Go to the SQL Editor in your Supabase dashboard
   - Run the `supabase_setup.sql` script to create tables and RLS policies
   - Run the `fix_rls_policy.sql` script if needed

3. Configure authentication:
   - Go to Authentication > Settings
   - Enable Email/Password sign-in
   - Configure email templates for production
   - Set up any additional auth providers if needed (Google, GitHub, etc.)

4. Set up Row Level Security (RLS):
   - Ensure all tables have appropriate RLS policies
   - Test the policies to verify they work as expected

5. Create the initial admin user:
   - You can either:
     - Use the Supabase dashboard to manually insert a user
     - Deploy the app and sign up, then update the user's role to 'admin' via SQL

### Security Considerations

1. **API Keys**: Keep your Supabase API keys secure and never commit them to version control
2. **RLS Policies**: Ensure all tables have appropriate RLS policies
3. **Backups**: Enable point-in-time recovery for your Supabase database
4. **Monitoring**: Set up database monitoring and alerts

## Vercel Deployment

Vercel is the recommended hosting platform for the Marketing Calendar SaaS application due to its simplicity and performance.

### Deploying to Vercel

1. Create a Vercel account at [https://vercel.com](https://vercel.com) if you don't have one

2. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

3. Log in to Vercel:
   ```bash
   vercel login
   ```

4. Deploy the application:
   ```bash
   vercel
   ```

5. Follow the prompts:
   - Set up and deploy "marketing-calendar-saas"? Yes
   - Which scope? (Select your account or team)
   - Link to existing project? No
   - What's your project's name? marketing-calendar-saas
   - In which directory is your code located? ./
   - Want to override the settings? Yes
   - Which framework preset would you like to use? Vite

6. Set up environment variables:
   - Go to your project on the Vercel dashboard
   - Navigate to Settings > Environment Variables
   - Add the following variables:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

7. Redeploy with the environment variables:
   ```bash
   vercel --prod
   ```

### Vercel Production Deployment

For subsequent deployments to production:

1. Push changes to your GitHub repository
2. Vercel will automatically deploy if you've set up GitHub integration
3. Alternatively, run:
   ```bash
   vercel --prod
   ```

## Netlify Deployment

Netlify is another excellent option for hosting the Marketing Calendar SaaS application.

### Deploying to Netlify

1. Create a Netlify account at [https://netlify.com](https://netlify.com) if you don't have one

2. Install the Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

3. Log in to Netlify:
   ```bash
   netlify login
   ```

4. Initialize Netlify in your project:
   ```bash
   netlify init
   ```

5. Follow the prompts:
   - Create & configure a new site
   - Select your team
   - Enter a site name (or accept the generated one)
   - Build command: `npm run build`
   - Directory to deploy: `dist`
   - No netlify.toml file needed

6. Set up environment variables:
   ```bash
   netlify env:set VITE_SUPABASE_URL your_supabase_url
   netlify env:set VITE_SUPABASE_ANON_KEY your_supabase_anon_key
   ```

7. Deploy to production:
   ```bash
   netlify deploy --prod
   ```

### Netlify Configuration

Create a `netlify.toml` file in the root of your project:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This configuration ensures that client-side routing works correctly.

## Docker Deployment

For more advanced deployment scenarios, you can use Docker.

### Creating a Docker Image

1. Create a `Dockerfile` in the root of your project:

```dockerfile
FROM node:16-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. Create an `nginx.conf` file:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

3. Build the Docker image:
   ```bash
   docker build -t marketing-calendar-saas .
   ```

4. Run the Docker container:
   ```bash
   docker run -p 8080:80 -e VITE_SUPABASE_URL=your_supabase_url -e VITE_SUPABASE_ANON_KEY=your_supabase_anon_key marketing-calendar-saas
   ```

### Deploying with Docker Compose

For a more complete setup, create a `docker-compose.yml` file:

```yaml
version: '3'
services:
  app:
    build: .
    ports:
      - "80:80"
    environment:
      - VITE_SUPABASE_URL=your_supabase_url
      - VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    restart: always
```

Run with:
```bash
docker-compose up -d
```

## Environment Variables

The following environment variables are required for the application:

| Variable | Description | Example |
|----------|-------------|---------|
| VITE_SUPABASE_URL | Your Supabase project URL | https://abcdefghijklm.supabase.co |
| VITE_SUPABASE_ANON_KEY | Your Supabase anon key | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... |

Optional environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_APP_TITLE | Application title | Marketing Calendar |
| VITE_DEFAULT_LOCALE | Default locale | en |

## Custom Domain Setup

### Vercel Custom Domain

1. Go to your project on the Vercel dashboard
2. Navigate to Settings > Domains
3. Add your domain
4. Follow the instructions to configure DNS settings

### Netlify Custom Domain

1. Go to your site on the Netlify dashboard
2. Navigate to Settings > Domain management
3. Click "Add custom domain"
4. Follow the instructions to configure DNS settings

### DNS Configuration

Typically, you'll need to add either:

1. A CNAME record pointing to your deployment URL
2. A set of A records pointing to the hosting provider's IP addresses

## SSL Configuration

Both Vercel and Netlify provide automatic SSL certificate provisioning and renewal through Let's Encrypt. No additional configuration is required.

For Docker deployments, consider using:
- Nginx Proxy Manager
- Traefik
- Caddy

These tools can automatically provision and manage SSL certificates.

## Post-Deployment Verification

After deploying, verify that:

1. The application loads correctly
2. Authentication works (sign up, sign in, sign out)
3. All API calls to Supabase work
4. The calendar view renders correctly
5. Forms submit data correctly
6. RLS policies are enforcing proper access control

### Verification Checklist

- [ ] Homepage loads
- [ ] Authentication flows work
- [ ] Dashboard loads after login
- [ ] Calendar view displays correctly
- [ ] Creating a new brief works
- [ ] Updating a brief works
- [ ] Resource management works
- [ ] Tradeshow management works
- [ ] User roles and permissions work correctly

## Monitoring and Logging

### Application Monitoring

Consider implementing:

1. **Error tracking**: Sentry, LogRocket, or similar
2. **Analytics**: Google Analytics, Plausible, or similar
3. **Performance monitoring**: Lighthouse CI, WebPageTest

### Supabase Monitoring

1. Enable database logs in Supabase dashboard
2. Set up database metrics monitoring
3. Configure alerts for critical errors

### Implementation Example

To add Sentry for error tracking:

1. Install Sentry:
   ```bash
   npm install @sentry/react @sentry/tracing
   ```

2. Initialize in `main.tsx`:
   ```typescript
   import * as Sentry from "@sentry/react";
   import { BrowserTracing } from "@sentry/tracing";

   Sentry.init({
     dsn: "your_sentry_dsn",
     integrations: [new BrowserTracing()],
     tracesSampleRate: 1.0,
   });
   ```

## Backup and Recovery

### Supabase Backups

1. Enable point-in-time recovery in Supabase
2. Schedule regular backups
3. Test the restoration process periodically

### Application Backups

1. Ensure your code is version-controlled
2. Consider backing up environment configurations
3. Document the deployment process for disaster recovery

## Scaling Considerations

The Marketing Calendar SaaS application is a static site that relies on Supabase for backend services. Scaling considerations include:

1. **Supabase Plan**: Upgrade your Supabase plan as user base grows
2. **CDN**: Use a CDN for static assets (built-in with Vercel and Netlify)
3. **Database Optimization**: Monitor and optimize database queries
4. **Rate Limiting**: Implement rate limiting for API calls

## Troubleshooting

### Common Issues

1. **White Screen / Application Not Loading**
   - Check browser console for errors
   - Verify environment variables are set correctly
   - Ensure build process completed successfully

2. **Authentication Issues**
   - Verify Supabase URL and anon key
   - Check Supabase authentication settings
   - Ensure email provider is configured correctly

3. **API Errors**
   - Check network tab in browser dev tools
   - Verify RLS policies
   - Check database permissions

4. **Routing Issues**
   - Ensure redirects are configured correctly
   - Verify client-side routing configuration

### Debugging Steps

1. Check application logs
2. Inspect network requests in browser dev tools
3. Verify environment variables
4. Test API endpoints directly using Supabase dashboard
5. Check for CORS issues

---

This deployment guide provides comprehensive instructions for deploying the Marketing Calendar SaaS application to production environments. For specific questions or issues, please refer to the documentation for your chosen deployment platform or open an issue on the GitHub repository. 