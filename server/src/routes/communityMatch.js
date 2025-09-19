// community match router for suburb matching functionality
const express = require("express");
const router = express.Router();
const { getPool } = require("../db");
const { asyncHandler } = require("../utils/asyncHandler");
const path = require("path");
const fs = require("fs");

// get languages with LGA population data
router.get("/languages", asyncHandler(async (req, res) => {
  // TODO: Replace with database query when language data is in DB
  // For now, return placeholder data based on legacy CSV structure
  
  const languages = [
    "English",
    "Mandarin", 
    "Arabic",
    "Vietnamese",
    "Italian",
    "Greek",
    "Cantonese",
    "Hindi",
    "Spanish",
    "Punjabi"
  ];

  return res.json({
    languages: languages.sort()
  });
}));

// get top LGAs by language population
router.get("/top-lgas/:language", asyncHandler(async (req, res) => {
  const { language } = req.params;
  
  // TODO: Implement actual database query
  // For now, return mock data based on legacy functionality
  
  const mockData = {
    "Mandarin": [
      { lga: "Monash", population: 15420 },
      { lga: "Glen Eira", population: 12380 },
      { lga: "Whitehorse", population: 11250 }
    ],
    "Arabic": [
      { lga: "Hume", population: 8920 },
      { lga: "Brimbank", population: 7150 },
      { lga: "Darebin", population: 6840 }
    ],
    "Vietnamese": [
      { lga: "Maribyrnong", population: 5680 },
      { lga: "Brimbank", population: 4920 },
      { lga: "Darebin", population: 4150 }
    ]
  };

  const data = mockData[language] || [];
  
  return res.json({
    language,
    topLgas: data
  });
}));

// get suburbs by council/LGA
router.get("/suburbs/:lga", asyncHandler(async (req, res) => {
  const { lga } = req.params;
  const pool = getPool();
  
  if (!pool) {
    return res.status(503).json({ error: "Database unavailable" });
  }

  try {
    // Query suburbs for the given LGA
    // TODO: Adjust table/column names based on actual schema
    const sql = `
      SELECT DISTINCT suburb as name
      FROM vic_geo.vic_suburb_list 
      WHERE lga_name = $1
      ORDER BY suburb ASC
      LIMIT 50
    `;
    
    const { rows } = await pool.query(sql, [lga]);
    
    return res.json({
      lga,
      suburbs: rows.map(row => ({ name: row.name }))
    });
  } catch (error) {
    console.error("Error fetching suburbs:", error);
    
    // Return mock data as fallback
    const mockSuburbs = [
      { name: "Brighton" },
      { name: "Carnegie" }, 
      { name: "Caulfield" },
      { name: "Elsternwick" },
      { name: "Ormond" }
    ];
    
    return res.json({
      lga,
      suburbs: mockSuburbs
    });
  }
}));

// get schools near a location
router.post("/schools-near", asyncHandler(async (req, res) => {
  const { lat, lng, radiusKm = 3, lga, limit = 200 } = req.body;
  
  // TODO: Implement actual school data query
  // For now, return mock school data
  
  const mockSchools = [
    {
      id: 1,
      name: "Brighton Primary School",
      type: "Primary",
      lat: lat + 0.001,
      lng: lng + 0.001,
      address: "123 School St, Brighton"
    },
    {
      id: 2, 
      name: "Carnegie Secondary College",
      type: "Secondary",
      lat: lat - 0.002,
      lng: lng + 0.002,
      address: "456 Education Ave, Carnegie"
    }
  ];

  return res.json({
    location: { lat, lng },
    radiusKm,
    lga,
    schools: mockSchools.slice(0, limit)
  });
}));

// export the router
module.exports = router;
