import { app } from "./app.js";
import { env } from "./config/env.js";

app.listen(env.port, () => console.log(`JECA Prep Hub API listening at http://localhost:${env.port}`));
