import { supabase } from "../utils/supabaseClient.js";

export const getSchools = async (req, res) => {
    try {
        const { data, error } = await supabase.from("schools").select("*");

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getSchoolById = async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from("schools")
            .select(`
        id, name, address, district, state,
        students:students(id, name, roll_no, class, section, gender, category,
          attendance:attendance(date, status)
        )
      `)
            .eq("id", id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
