const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3000;
app.options("*", cors());
// Middleware
app.use(bodyParser.json());
app.use(express.static("public")); // Serve static files from 'public' folder

// Static admin credentials
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123"; // Change this to a more secure password

// Path to ads file
const adsFilePath = path.join(__dirname, "ads.json");

// Ensure the file exists
if (!fs.existsSync(adsFilePath)) {
  fs.writeFileSync(adsFilePath, "[]", "utf8");
}

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res
      .status(401)
      .json({ success: false, message: "Invalid username or password" });
  }
});

app.post("/api/ads", (req, res) => {
  const { name, website, placement, script } = req.body;

  if (!name || !website || !placement || !script) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  // Read existing ads
  fs.readFile(adsFilePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error reading ads file" });
    }

    let ads = JSON.parse(data);
    const newAd = {
      id: ads.length + 1,
      name,
      website,
      placement,
      script,
    };

    ads.push(newAd);

    // Save to file
    fs.writeFile(adsFilePath, JSON.stringify(ads, null, 2), "utf8", (err) => {
      if (err) {
        return res.status(500).json({ error: "Error saving ad" });
      }
      res.status(201).json({ message: "Ad added successfully!", newAd });
    });
  });
});

app.get("/api/ads", (req, res) => {
  fs.readFile(adsFilePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error fetching ads" });
    }
    res.json(JSON.parse(data));
  });
});

app.get("/api/ads/embed_script/:id", (req, res) => {
  fs.readFile(adsFilePath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Error reading ads file" });

    const ads = JSON.parse(data);
    const ad = ads.find((ad) => ad.id == req.params.id);

    if (!ad) return res.status(404).json({ error: "Ad not found" });

    const embedCode = `<script>${ad.script}</script>`;
    res.json({ embed_code: embedCode });
  });
});

app.get("/api/ads/:id", (req, res) => {
  fs.readFile(adsFilePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error fetching ads" });
    }
    const ads = JSON.parse(data);
    const ad = ads.find((a) => a.id === parseInt(req.params.id));

    if (!ad) {
      return res.status(404).json({ error: "Ad not found" });
    }

    res.json(ad);
  });
});

app.put("/api/ads/:id", (req, res) => {
  fs.readFile(adsFilePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error fetching ads" });
    }
    let ads = JSON.parse(data);
    const adIndex = ads.findIndex((a) => a.id === parseInt(req.params.id));

    if (adIndex === -1) {
      return res.status(404).json({ error: "Ad not found" });
    }

    // Update ad details
    ads[adIndex] = { ...ads[adIndex], ...req.body };

    // Write updated ads back to the file
    fs.writeFile(adsFilePath, JSON.stringify(ads, null, 2), "utf8", (err) => {
      if (err) {
        return res.status(500).json({ error: "Error updating ad" });
      }
      res.json({ message: "Ad updated successfully", ad: ads[adIndex] });
    });
  });
});
app.delete("/api/ads/:id", (req, res) => {
  fs.readFile(adsFilePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error fetching ads" });
    }
    let ads = JSON.parse(data);
    const adIndex = ads.findIndex((a) => a.id === parseInt(req.params.id));

    if (adIndex === -1) {
      return res.status(404).json({ error: "Ad not found" });
    }

    // Remove the ad from the array
    ads.splice(adIndex, 1);

    // Write updated ads back to the file
    fs.writeFile(adsFilePath, JSON.stringify(ads, null, 2), "utf8", (err) => {
      if (err) {
        return res.status(500).json({ error: "Error deleting ad" });
      }
      res.json({ message: "Ad deleted successfully" });
    });
  });
});
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
