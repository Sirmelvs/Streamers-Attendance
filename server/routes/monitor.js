const express = require('express');
const { runLiveCheck, getUseScrapeFallback, setUseScrapeFallback, getLastLiveCheckDetails } = require('../services/liveMonitor');

const router = express.Router();

router.get('/check', async (req, res) => {
  try {
    await runLiveCheck();
    res.json({
      message: 'Live check completed',
      lastLiveCheckDetails: getLastLiveCheckDetails()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/settings', (req, res) => {
  res.json({
    useScrapeFallback: getUseScrapeFallback(),
    lastLiveCheckDetails: getLastLiveCheckDetails()
  });
});

router.post('/settings', (req, res) => {
  const { useScrapeFallback } = req.body;
  if (typeof useScrapeFallback !== 'boolean') {
    return res.status(400).json({ error: 'useScrapeFallback must be a boolean' });
  }

  setUseScrapeFallback(useScrapeFallback);
  res.json({ useScrapeFallback: getUseScrapeFallback() });
});

module.exports = router;
