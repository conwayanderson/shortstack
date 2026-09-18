import { createApp } from "./app.js";
import { load } from "./store.js";

load();
const port = Number(process.env.PORT ?? 3000);
createApp().listen(port, () => console.log(`shortstack on :${port}`));
