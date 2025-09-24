import express from "express";
import { getSchools, getSchoolById } from "../controllers/schoolController.js";
import { supabase } from "../utils/supabaseClient.js";
const router = express.Router();

router.get("/", getSchools);
router.get("/:id", getSchoolById);


/// Get all districts
router.get("/districts", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("schools")
            .select("district"); // get all districts

        if (error) throw error;

        if (!data || !Array.isArray(data)) {
            return res.status(500).json({ error: "Invalid data from DB" });
        }

        // filter out null/undefined and get unique values
        const districts = [...new Set(data
            .map((s) => s.district)
            .filter(Boolean) // remove null/undefined
        )];

        res.json(districts); // return array
    } catch (err) {
        console.error("Error fetching districts:", err.message);
        res.status(500).json({ error: "Failed to fetch districts" });
    }
});

// Get all schools (optionally by district)
// Get all schools (optionally by district)
router.get("/all", async (req, res) => {
    const { district } = req.query;

    try {
        let query = supabase.from("schools").select("id, name, district");
        if (district) {
            query = query.eq("district", district);
        }

        const { data, error } = await query;
        if (error) throw error;

        if (!data || !Array.isArray(data)) {
            return res.status(500).json({ error: "Invalid data from DB" });
        }

        // Return only id + name for dropdown
        const schools = data.map((s) => ({ id: s.id, name: s.name }));
        res.json(schools);
    } catch (err) {
        console.error("Error fetching schools:", err.message);
        res.status(500).json({ error: "Failed to fetch schools" });
    }
});


export default router;
