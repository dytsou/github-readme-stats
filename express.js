import "dotenv/config";
import statsCard from "./api/index.js";
import repoCard from "./api/pin.js";
import langCard from "./api/top-langs.js";
import wakatimeCard from "./api/wakatime.js";
import gistCard from "./api/gist.js";
import profileContext from "./api/profile-context.js";
import streakCard from "./api/streak.js";
import sparklineCard from "./api/sparkline.js";
import heatmapCard from "./api/heatmap.js";
import express from "express";

const app = express();
app.disable("x-powered-by");
const router = express.Router();

router.get("/", statsCard);
router.get("/pin", repoCard);
router.get("/top-langs", langCard);
router.get("/wakatime", wakatimeCard);
router.get("/gist", gistCard);
router.get("/profile/context", profileContext);
router.get("/streak", streakCard);
router.get("/sparkline", sparklineCard);
router.get("/heatmap", heatmapCard);

app.use("/api", router);

const port = process.env.PORT || process.env.port || 9000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
