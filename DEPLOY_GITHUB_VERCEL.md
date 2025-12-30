# Deploy 702Greens Farm OS to Vercel + GitHub

**Total time: 15 minutes**

---

## STEP 1: Create GitHub Repository (2 min)

### On GitHub.com:
1. Go to https://github.com/new
2. Repository name: `702greens-farm-os`
3. Description: "Farm Operations System for 702Greens"
4. Choose **Public** (so I can help debug if needed)
5. **Skip** "Initialize with README" (we have one)
6. Click **Create Repository**

You'll see a screen with commands. **Copy the HTTPS URL** - you'll need it.

---

## STEP 2: Push Your Code to GitHub (5 min)

### In Terminal/Command Prompt:

```bash
# Navigate to your project folder
cd /path/to/702greens-farm-os

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Farm OS"

# Add remote (replace USERNAME and REPO with yours)
git remote add origin https://github.com/702greens/702greens-farm-os.git

# Push to GitHub
git branch -M main
git push -u origin main
```

If you get an error about authentication, use this instead:
```bash
git config --global credential.helper store
git push -u origin main
```
Then enter your GitHub username and **personal access token** (from GitHub Settings > Developer Settings > Personal access tokens)

### Verify it worked:
Go to https://github.com/702greens/702greens-farm-os
You should see all your files there.

---

## STEP 3: Deploy to Vercel (3 min)

### On Vercel.com:

1. Go to https://vercel.com
2. Sign up with GitHub (click "Continue with GitHub")
3. Authorize Vercel to access your GitHub account
4. Click **Import Project**
5. Paste your repo URL: `https://github.com/702greens/702greens-farm-os`
6. Click **Continue**
7. Configure project:
   - Framework Preset: **Other**
   - Root Directory: `./` (default)
   - Build Command: blank (leave empty)
   - Output Directory: blank
   - Install Command: `npm install`
8. Click **Deploy**

Vercel will start building. **Wait 2-3 minutes.**

---

## STEP 4: Set Environment Variables (3 min)

Once deployment is done, you'll get a Vercel URL like:
`https://702greens-farm-os.vercel.app`

**But it won't work yet** - it needs environment variables.

### In Vercel Dashboard:

1. Click your project
2. Go to **Settings** (top menu)
3. Click **Environment Variables** (left sidebar)
4. Add these 4 variables:

| Key | Value |
|-----|-------|
| `CLAUDE_API_KEY` | `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` |
| `CLOSE_API_KEY` | `api_7cZ8hLOwUaWGuUi6xEqDX7.1PHXFkGgecAjj79xaQlvwA` |
| `DATABASE_URL` | `postgresql://neondb_owner:npg_VyA6oRxKG9fZ@ep-wandering-waterfall-a466jlsh-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |
| `YOUR_PHONE` | `2132215504` |

For each variable:
- Paste key in left box
- Paste value in right box
- Select **Production** (checkbox)
- Click **Add**

### Redeploy:
- Go back to **Deployments** (top menu)
- Click the latest deployment
- Click **Redeploy** button
- Wait 2 minutes

---

## STEP 5: Test It (2 min)

### Visit your deployed app:
Go to: `https://702greens-farm-os.vercel.app` (replace with your actual URL)

You should see the 702Greens form.

### Test submission:
1. Fill out the form with test data
2. Click "Submit Daily Log"
3. **Within 5 seconds**, you should get a text on your phone
4. Check Vercel Logs to see what happened:
   - In Vercel dashboard, click **Logs** (top menu)
   - You should see Claude analysis and SMS confirmation

---

## STEP 6: Set Up Your Farm Manager (1 min)

### Share the URL with your farm manager:
`https://702greens-farm-os.vercel.app`

She can:
- Open on her phone/tablet
- Fill out form
- See all previous logs
- Submit
- You automatically get texted

---

## Going Forward: Making Updates

Every time you want to update code:

```bash
# Make your changes locally

# Commit and push
git add .
git commit -m "Your update description"
git push origin main
```

Vercel automatically redeploys when you push to GitHub. **No manual deployment needed.**

---

## Troubleshooting

### "Database connection failed"
- Check DATABASE_URL is exactly correct in Vercel settings
- Verify Neon project is active
- Try accessing Neon dashboard to confirm it's running

### "Claude API error"
- Verify CLAUDE_API_KEY in Vercel settings is correct
- Check you have Claude API access enabled at https://console.anthropic.com

### "SMS not sending"
- Verify CLOSE_API_KEY is correct
- Check Close CRM account has SMS enabled
- Look at Vercel Logs for error messages

### "Deployment keeps failing"
- Check Vercel Logs for specific error
- Verify all environment variables are set
- Make sure package.json dependencies are correct

### "Form won't load"
- Check public/index.html exists
- Open browser DevTools (F12) and check Console for errors
- Verify API endpoints are responding: `https://702greens-farm-os.vercel.app/api/health`

---

## Monitoring & Logs

### View production logs in Vercel:
- Vercel Dashboard → Your Project → **Logs** tab
- Shows Claude analysis, API calls, errors
- Useful for debugging

### View database:
- Go to https://neon.tech
- Sign in
- Click your project
- See all daily_logs data there

---

## Scaling (Later)

When you're ready:
- Add cron jobs for weekly summaries
- Export to Google Sheets
- Add more team members
- Add authentication

For now: **You have a production-ready farm OS.**

---

## Summary

✅ Code on GitHub (version control)
✅ App deployed on Vercel (live at URL)
✅ Database on Neon (auto-scaling)
✅ Claude analyzing every submission
✅ Close CRM texting you summaries

Your farm manager can start using it today.

Any issues, check Vercel Logs first - they'll show exactly what's wrong.
