/** Set before server modules load so API limits/slim JSON apply on Netlify. */
process.env.REALTIME_UI_MATCHER_SERVERLESS = "1";
