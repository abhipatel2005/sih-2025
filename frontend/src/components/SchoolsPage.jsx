import { useState } from "react";
// import Modal from "./Modal";
import { useEffect } from "react";
import { supabase } from '../config/SupaBaseClient.js'
function SchoolsPage() {
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalSchools, setTotalSchools] = useState(0);
    const pageSize = 6;

    useEffect(() => {
        fetchSchools();
    }, [page]);

    const fetchSchools = async () => {
        setLoading(true);

        // Count total schools for pagination
        const { count, error: countError } = await supabase
            .from("schools")
            .select("*", { count: "exact", head: true });

        if (!countError) setTotalSchools(count);

        // Fetch paginated data (name, address only)
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error } = await supabase
            .from("schools")
            .select("id, name, address")
            .range(from, to);

        if (error) {
            console.error("Error fetching schools:", error);
        } else {
            setSchools(data);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-10">
            {/* Header with Add Button(optional) */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    Registered Government Schools in Punjab
                </h1>
            </div>

            {/* Table */}
            {loading ? (
                <p className="text-gray-500">Loading...</p>
            ) : (
                <div className="overflow-x-auto bg-white shadow-md rounded-lg">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-green-100">
                            <tr>
                                <th className="p-3 border-b">Name</th>
                                <th className="p-3 border-b">Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schools.map((school) => (
                                <tr key={school.id} className="hover:bg-gray-50">
                                    <td className="p-3 border-b">{school.name}</td>
                                    <td className="p-3 border-b">{school.address}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
                <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300"
                >
                    Previous
                </button>
                <p className="text-gray-700">
                    Page {page} of {Math.ceil(totalSchools / pageSize)}
                </p>
                <button
                    onClick={() =>
                        setPage((prev) =>
                            prev < Math.ceil(totalSchools / pageSize) ? prev + 1 : prev
                        )
                    }
                    disabled={page >= Math.ceil(totalSchools / pageSize)}
                    className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300"
                >
                    Next
                </button>
            </div>
        </div>
    );
}

export default SchoolsPage