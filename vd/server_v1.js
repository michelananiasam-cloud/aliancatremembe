const express = require("express");
const { execSync } = require("child_process");

const app = express();

app.use(express.static("public"));

app.get("/api/stream/:id", (req, res) => {

    try {

        const streamUrl = execSync(
            `yt-dlp -f 18 -g "https://youtu.be/${req.params.id}"`,
            { encoding: "utf8" }
        ).trim();

        res.json({
            ok: true,
            stream_url: streamUrl
        });

    } catch (err) {

        res.json({
            ok: false,
            erro: err.message
        });

    }

});

app.listen(3000, () => {
    console.log("http://localhost:3000");
});