import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pkg from 'pg';
import Anthropic from '@anthropic-ai/sdk';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Environment variables
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLOSE_API_KEY = process.env.CLOSE_API_KEY;
const YOUR_PHONE = process.env.YOUR_PHONE || '2132215504';
const DATABASE_URL = process.env.DATABASE_URL;

// Validate required env vars
if (!CLAUDE_API_KEY) {
  console.warn('⚠️  CLAUDE_API_KEY not set');
}
if (!CLOSE_API_KEY) {
  console.warn('⚠️  CLOSE_API_KEY not set');
}
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set. Cannot start.');
  process.exit(1);
}

// Initialize PostgreSQL pool
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('Unexpected pool error:', err);
});

// Initialize Anthropic client
const client = new Anthropic({
  apiKey: CLAUDE_API_KEY
});

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Create table if it doesn't exist
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_logs (
        id SERIAL PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        plan_harvest TEXT,
        plan_plant TEXT,
        plan_deliveries TEXT,
        plan_other TEXT,
        done_harvest TEXT,
        done_plant TEXT,
        done_deliveries TEXT,
        done_other TEXT,
        sop_complete TEXT,
        sop_missed TEXT,
        sop_why TEXT,
        yield_on_target TEXT,
        yield_crop TEXT,
        yield_off_reason TEXT,
        yield_action TEXT,
        time_start TEXT,
        time_end TEXT,
        time_drain TEXT,
        time_why TEXT,
        tomorrow_harvest TEXT,
        tomorrow_plant TEXT,
        tomorrow_focus TEXT,
        tomorrow_risk TEXT,
        initials TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Initialize on startup
initializeDatabase();

// ============ API ENDPOINTS ============

// GET all logs
app.get('/api/logs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM daily_logs ORDER BY date DESC LIMIT 30');
    res.json(result.rows || []);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET today's log
app.get('/api/logs/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await pool.query('SELECT * FROM daily_logs WHERE date = $1', [today]);
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Error fetching today log:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST new log
app.post('/api/logs', async (req, res) => {
  try {
    const {
      date,
      plan_harvest,
      plan_plant,
      plan_deliveries,
      plan_other,
      done_harvest,
      done_plant,
      done_deliveries,
      done_other,
      sop_complete,
      sop_missed,
      sop_why,
      yield_on_target,
      yield_crop,
      yield_off_reason,
      yield_action,
      time_start,
      time_end,
      time_drain,
      time_why,
      tomorrow_harvest,
      tomorrow_plant,
      tomorrow_focus,
      tomorrow_risk,
      initials
    } = req.body;

    const query = `
      INSERT INTO daily_logs (
        date, plan_harvest, plan_plant, plan_deliveries, plan_other,
        done_harvest, done_plant, done_deliveries, done_other,
        sop_complete, sop_missed, sop_why,
        yield_on_target, yield_crop, yield_off_reason, yield_action,
        time_start, time_end, time_drain, time_why,
        tomorrow_harvest, tomorrow_plant, tomorrow_focus, tomorrow_risk, initials
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
      ON CONFLICT (date) DO UPDATE SET
        plan_harvest = $2, plan_plant = $3, plan_deliveries = $4, plan_other = $5,
        done_harvest = $6, done_plant = $7, done_deliveries = $8, done_other = $9,
        sop_complete = $10, sop_missed = $11, sop_why = $12,
        yield_on_target = $13, yield_crop = $14, yield_off_reason = $15, yield_action = $16,
        time_start = $17, time_end = $18, time_drain = $19, time_why = $20,
        tomorrow_harvest = $21, tomorrow_plant = $22, tomorrow_focus = $23, tomorrow_risk = $24, initials = $25
      RETURNING id
    `;

    const values = [
      date, plan_harvest, plan_plant, plan_deliveries, plan_other,
      done_harvest, done_plant, done_deliveries, done_other,
      sop_complete, sop_missed, sop_why,
      yield_on_target, yield_crop, yield_off_reason, yield_action,
      time_start, time_end, time_drain, time_why,
      tomorrow_harvest, tomorrow_plant, tomorrow_focus, tomorrow_risk, initials
    ];

    const result = await pool.query(query, values);
    console.log(`✓ Daily log saved for ${date}`);

    // Trigger Claude analysis and text in background
    analyzeDayAndSendText(req.body).catch(error => {
      console.error('Warning: Analysis failed but log was saved:', error);
    });

    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error('Error saving log:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ CLAUDE ANALYSIS ============

async function analyzeDayAndSendText(logData) {
  console.log('🤖 Starting Claude analysis...');

  const context = `
DAILY LOG - ${logData.date}

PLAN vs ACTUAL:
- Planned Harvest: ${logData.plan_harvest || 'none'}
- Actual Harvest: ${logData.done_harvest || 'none'}
- Planned Plant: ${logData.plan_plant || 'none'}
- Actual Plant: ${logData.done_plant || 'none'}

SOP COMPLIANCE:
- Complete: ${logData.sop_complete}
- If NO - Missed: ${logData.sop_missed || 'N/A'}
- Why: ${logData.sop_why || 'N/A'}

YIELD:
- On Target: ${logData.yield_on_target}
- Crop (if off): ${logData.yield_crop || 'N/A'}
- Issue: ${logData.yield_off_reason || 'N/A'}
- Action: ${logData.yield_action || 'N/A'}

TIME:
- ${logData.time_start} to ${logData.time_end}
- Biggest drain: ${logData.time_drain || 'N/A'}
- Reason: ${logData.time_why || 'N/A'}

TOMORROW:
- Focus/Risk: ${logData.tomorrow_focus}
  `;

  const prompt = `You are analyzing a daily farm operations log for 702Greens microgreens farm.

${context}

Provide a SHORT 2-3 sentence text message summary that includes:
1. Overall status (✓ Green / ⚠ Yellow / ⚠ Red)
2. Key issue if any
3. One action if needed

Keep it like a text message - concise and actionable. Include emoji.`;

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const summary = message.content[0].text;
    console.log('✓ Claude analysis complete');

    // Send text via Close API
    await sendCloseMessage(YOUR_PHONE, `702Greens Daily Log\n\n${summary}`);
  } catch (error) {
    console.error('Claude API error:', error.message);
    // Send error notification
    await sendCloseMessage(YOUR_PHONE, `⚠️ Farm log received but Claude analysis failed. Check logs.`);
  }
}

// ============ CLOSE CRM TEXTING ============

async function sendCloseMessage(phoneNumber, messageText) {
  console.log(`📱 Sending SMS to ${phoneNumber}...`);

  try {
    const response = await fetch('https://api.close.com/api/v1/activity/sms/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOSE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: phoneNumber,
        body: messageText
      })
    });

    if (response.ok) {
      console.log('✓ SMS sent successfully');
    } else {
      const error = await response.text();
      console.error('Close API error:', error);
    }
  } catch (error) {
    console.error('Error sending SMS:', error.message);
  }
}

// ============ HEALTH CHECK ============

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ START SERVER ============

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════╗
║    702GREENS FARM OS - VERCEL        ║
║                                      ║
║    Running on port ${PORT}              ║
║                                      ║
║    Database: Neon PostgreSQL         ║
║    API: Close CRM                    ║
║    AI: Claude Sonnet                 ║
╚══════════════════════════════════════╝
  `);
});

export default app;
