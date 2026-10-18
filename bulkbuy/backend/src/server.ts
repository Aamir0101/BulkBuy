import { app } from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[BulkBuy Backend] REST API server running on port ${PORT}`);
  console.log(`[BulkBuy Backend] Base URL: http://localhost:${PORT}/api/v1`);
});
