import { supabase } from "../utils/supabaseClient.js";

// export const getSchools = async (req, res) => {
//     const { page = 1, pageSize = 6 } = req.query;
//     const from = (page - 1) * pageSize;
//     const to = from + parseInt(pageSize) - 1;

//     try {
//         // Get total count
//         const { count, error: countError } = await supabase
//             .from("schools")
//             .select("*", { count: "exact", head: true });

//         if (countError) throw countError;

//         // Fetch paginated data
//         const { data, error } = await supabase
//             .from("schools")
//             .select("id, name, address")
//             .range(from, to);

//         if (error) throw error;

//         res.json({ total: count, data });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// };

export const getSchools = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 6;

    try {
        // Count total schools
        const { count, error: countError } = await supabase
            .from("schools")
            .select("*", { count: "exact", head: true });

        if (countError) throw countError;

        // Paginated fetch
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error } = await supabase
            .from("schools")
            .select("id, name, address")
            .range(from, to);

        if (error) throw error;

        res.json({
            data,
            total: count,
            page,
            pageSize,
        });
    } catch (err) {
        console.error("Error fetching schools:", err.message);
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
