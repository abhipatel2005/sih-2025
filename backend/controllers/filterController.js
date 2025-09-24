import { supabase } from "../utils/supabaseClient.js";

export const filterAttendance = async (req, res) => {
    const { school_id, start_date, end_date } = req.query;

    try {
        let query = supabase
            .from("attendance")
            .select(`
        id, date, status,
        student:students(id, name, roll_no, class, section, school:schools(name))
      `);

        if (school_id) {
            query = query.eq("student.school_id", school_id);
        }
        if (start_date && end_date) {
            query = query.gte("date", start_date).lte("date", end_date);
        }

        const { data, error } = await query;

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
