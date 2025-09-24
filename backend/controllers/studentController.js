import { supabase } from "../utils/supabaseClient.js";

export const getStudents = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("students")
            .select(`
        id, name, roll_no, class, section, gender, category,
        school:schools(name, district, state),
        attendance:attendance(date, status)
      `);

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
