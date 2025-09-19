import { Router } from 'express';
import Bet from '../models/Bet.js';
import User from '../models/User.js';
import { decrypt } from '../utils/crypto.js';
import {
  summarizeForModel,
  computeUserStatsForClient,
  selectBetsWithFilters,
  buildFilterFacets,
  formatDrawdown,
} from '../utils/analysis.js';
import logger from '../utils/logger.js';

const router = Router();

const DEFAULT_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

function parseArrayParam(param) {
  if (!param) return [];
  if (Array.isArray(param)) {
    return param.flatMap(value => String(value).split(',')).map(v => v.trim()).filter(Boolean);
  }
  return String(param)
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
}

function normalizeFilters(filters = {}) {
  const normalized = {};
  if (filters.startDate) normalized.startDate = filters.startDate;
  if (filters.endDate) normalized.endDate = filters.endDate;
  if (filters.sports) {
    normalized.sports = Array.isArray(filters.sports)
      ? filters.sports.filter(Boolean)
      : parseArrayParam(filters.sports);
  }
  if (filters.betTypes) {
    normalized.betTypes = Array.isArray(filters.betTypes)
      ? filters.betTypes.filter(Boolean)
      : parseArrayParam(filters.betTypes);
  }
  if (filters.outcomes) {
    normalized.outcomes = Array.isArray(filters.outcomes)
      ? filters.outcomes.filter(Boolean)
      : parseArrayParam(filters.outcomes);
  }
  return normalized;
}

async function fetchUserBets(userId) {
  const bets = await Bet.find({ user: userId }).lean({ getters: true });
  return bets;
}

router.get('/context', async (req, res) => {
  try {
    const filters = normalizeFilters(req.query || {});
    const [user, allBets] = await Promise.all([
      User.findById(req.user.id).select('openAiKey openAiKeySetAt username').lean({ getters: true }),
      fetchUserBets(req.user.id),
    ]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const scope = filters && Object.keys(filters).length ? 'filtered' : 'all';
    const selectedBets = scope === 'filtered' ? selectBetsWithFilters(allBets, filters) : allBets;
    const summary = summarizeForModel(selectedBets, { scope, filters });
    const globalStats = computeUserStatsForClient(allBets);
    const facets = buildFilterFacets(allBets);

    res.json({
      scope: summary.scope,
      filters: summary.filtersApplied,
      metrics: summary.metrics,
      breakdowns: summary.breakdowns,
      dataset: summary.dataset,
      drawdown: formatDrawdown(summary.drawdown),
      issues: summary.issues,
      availableFilters: facets,
      globalStats,
      aiKeyConfigured: Boolean(user.openAiKey),
      aiKeySetAt: user.openAiKeySetAt || null,
      sampleSize: summary.sampleSize,
      hasClosingOdds: summary.metrics.closingTracked > 0,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: 'Failed to prepare AI context' });
  }
});

function buildSchema() {
  return {
    name: 'AiReply',
    schema: {
      type: 'object',
      properties: {
        answer: { type: 'string', description: 'Narrative response for the user. Use plain text.' },
        metrics: {
          type: 'object',
          properties: {
            totalBets: { type: 'integer' },
            winRatePct: { type: ['number', 'null'] },
            roiPct: { type: ['number', 'null'] },
            netProfit: { type: ['number', 'null'] },
            avgOdds: { type: ['number', 'null'] },
            clvPct: { type: ['number', 'null'] },
            longestWinStreak: { type: ['integer', 'null'] },
            longestLossStreak: { type: ['integer', 'null'] },
          },
        },
        breakdowns: {
          type: 'object',
          properties: {
            bySport: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                properties: {
                  bets: { type: 'integer' },
                  winRatePct: { type: ['number', 'null'] },
                  roiPct: { type: ['number', 'null'] },
                  netProfit: { type: ['number', 'null'] },
                },
              },
            },
            byMarket: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                properties: {
                  bets: { type: 'integer' },
                  roiPct: { type: ['number', 'null'] },
                  netProfit: { type: ['number', 'null'] },
                },
              },
            },
            byMonth: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  x: { type: ['string', 'number'] },
                  y: { type: 'number' },
                },
                required: ['x', 'y'],
              },
            },
          },
        },
        chart: {
          type: ['object', 'null'],
          properties: {
            type: { type: 'string', enum: ['line', 'bar', 'area'] },
            title: { type: 'string' },
            yLabel: { type: ['string', 'null'] },
            series: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  points: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        x: { type: ['string', 'number'] },
                        y: { type: 'number' },
                      },
                      required: ['x', 'y'],
                    },
                  },
                },
                required: ['name', 'points'],
              },
            },
          },
        },
        followUps: {
          type: 'array',
          items: { type: 'string' },
          minItems: 0,
          maxItems: 5,
        },
      },
      required: ['answer'],
      additionalProperties: true,
    },
  };
}

function sendSse(res, event, data) {
  res.write(`event: ${event}\n`);
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  res.write(`data: ${payload}\n\n`);
}

router.post('/analyze', async (req, res) => {
  const { message, scope = 'all', filters = {}, history = [] } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'A question is required.' });
  }

  try {
    const normalizedFilters = normalizeFilters(filters);
    const [user, allBets] = await Promise.all([
      User.findById(req.user.id).select('+openAiKey openAiKeySetAt username').lean({ getters: true }),
      fetchUserBets(req.user.id),
    ]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.openAiKey) {
      return res.status(400).json({ error: 'OpenAI API key is not configured for this account.' });
    }

    const apiKey = decrypt(user.openAiKey);
    if (!apiKey) {
      return res.status(400).json({ error: 'Stored API key could not be decrypted. Please re-save it.' });
    }

    const dataScope = scope === 'filtered' ? 'filtered' : 'all';
    const selectedBets = dataScope === 'filtered'
      ? selectBetsWithFilters(allBets, normalizedFilters)
      : allBets;

    if (!selectedBets.length) {
      return res.status(400).json({ error: 'No bets found for the selected scope/filters.' });
    }

    const summary = summarizeForModel(selectedBets, { scope: dataScope, filters: normalizedFilters });
    const decided = summary.metrics.decidedBets || 0;
    const tooSmall = decided < 3;

    const systemPrompt = [
      'You are the AI analyst for a sports betting tracker. The user will provide a data summary JSON containing their bets.',
      'Use only the provided numbers. Do not invent data. Call out limitations when sample sizes are small.',
      'When datasetTooSmall is true, highlight that insights may not be statistically significant and encourage broader analysis.',
      'If issues are listed, acknowledge them in the answer.',
      'Provide practical strategy suggestions grounded in the numbers and trends.',
      'Always respond with JSON that follows the supplied schema.',
      'Narrative should be concise but specific, referencing concrete values from the summary.',
    ].join(' ');

    const historyMessages = Array.isArray(history)
      ? history.slice(-6).map(entry => ({
          role: entry?.role === 'assistant' ? 'assistant' : 'user',
          content: typeof entry?.content === 'string' ? entry.content : JSON.stringify(entry?.content || ''),
        }))
      : [];

    const userContent = JSON.stringify({
      question: message,
      summary,
      datasetTooSmall: tooSmall,
    });

    const body = {
      model: DEFAULT_MODEL,
      temperature: 0.2,
      response_format: { type: 'json_schema', json_schema: buildSchema() },
      messages: [
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: userContent },
      ],
    };

    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      logger.error('OpenAI error:', errorText);
      return res.status(502).json({ error: 'Failed to generate AI analysis.' });
    }

    const completion = await openAiResponse.json();
    const rawContent = completion?.choices?.[0]?.message?.content;
    let aiReply;
    try {
      aiReply = rawContent ? JSON.parse(rawContent) : { answer: '' };
    } catch (err) {
      logger.error('Failed to parse AI response', err);
      aiReply = { answer: rawContent || '' };
    }

    const metrics = {
      totalBets: summary.metrics.totalBets,
      winRatePct: summary.metrics.winRatePct,
      roiPct: summary.metrics.roiPct,
      netProfit: summary.metrics.netProfit,
      avgOdds: summary.metrics.avgOdds,
      clvPct: summary.metrics.clvPct,
      longestWinStreak: summary.metrics.longestWinStreak,
      longestLossStreak: summary.metrics.longestLossStreak,
    };

    const finalPayload = {
      answer: aiReply?.answer || '',
      metrics,
      breakdowns: {
        bySport: summary.breakdowns.bySport,
        byMarket: summary.breakdowns.byMarket,
        byMonth: summary.breakdowns.byMonth,
      },
      chart: aiReply?.chart || null,
      followUps: Array.isArray(aiReply?.followUps) ? aiReply.followUps.slice(0, 5) : [],
      context: {
        scope: summary.scope,
        filters: summary.filtersApplied,
        dataset: summary.dataset,
        drawdown: formatDrawdown(summary.drawdown),
        issues: summary.issues,
      },
    };

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    const tokens = finalPayload.answer ? finalPayload.answer.match(/(\S+|\s+)/g) : [];
    if (tokens) {
      for (const token of tokens) {
        sendSse(res, 'token', token);
      }
    }

    sendSse(res, 'payload', finalPayload);
    sendSse(res, 'end', 'done');
    res.end();
  } catch (err) {
    logger.error(err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate AI analysis.' });
    } else {
      sendSse(res, 'error', { message: 'An unexpected error occurred.' });
      res.end();
    }
  }
});

export default router;
