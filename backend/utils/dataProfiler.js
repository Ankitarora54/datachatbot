const { queryDB } = require("../db");
let cache = null;
let lastUpdated = 0;

async function getDataProfile() {
    
  // sector exposure stats

  const sectorStats = await queryDB(`

    SELECT

      sector,

      ROUND(MAX(sector_weight), 2)
        AS max_weight,

      ROUND(AVG(sector_weight), 2)
        AS avg_weight

    FROM sector_exposure_view

    GROUP BY sector

    ORDER BY max_weight DESC

  `);

  return {

    sectorStats

  };

}

module.exports = { getDataProfile };