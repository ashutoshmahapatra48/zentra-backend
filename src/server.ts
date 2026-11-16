import { app } from "./app.js";
import { config } from "./config/env.js";
import { connectDatabase } from "./config/database.js";

await connectDatabase();
app.listen(config.port, () => console.log(`Zentra API listening on http://localhost:${config.port}`));
