const app = require('../server');

module.exports = (req, res) => {
  try {
    // Validate request URL
    if (!req.url || typeof req.url !== 'string') {
      return res.status(400).json({ error: 'Invalid request URL' });
    }
    
    // Check for malformed URLs that might cause path-to-regexp errors
    if (req.url.includes('http://') || req.url.includes('https://')) {
      return res.status(400).json({ error: 'Malformed URL detected' });
    }
    
    // Handle the request
    app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
