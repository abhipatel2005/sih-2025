import { useState, useEffect } from "react";

function SchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalSchools, setTotalSchools] = useState(0);
  const pageSize = 6;

  useEffect(() => {
    fetchSchools();
  }, [page]);

  //   const fetchSchools = async () => {
  //     setLoading(true);
  //     try {
  //       // 👇 Call your backend API
  //       const res = await fetch(`/api/schools/`);
  //       const result = await res.json();

  //       if (res.ok) {
  //         setSchools(result.data);
  //         setTotalSchools(result.total);
  //       } else {
  //         console.error("Error fetching schools:", result.error);
  //       }
  //     } catch (err) {
  //       console.error("Network error:", err);
  //     }
  //     setLoading(false);
  //   };

  const fetchSchools = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/schools?page=${page}&pageSize=${pageSize}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch schools");
      }

      const result = await response.json();

      setSchools(result.data);
      setTotalSchools(result.total);
    } catch (error) {
      console.error("Error fetching schools:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      {/* Header */}
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

export default SchoolsPage;
