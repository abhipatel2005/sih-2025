// import { useState } from "react";

// function FilterCard() {
//     const [district, setDistrict] = useState("");
//     const [school, setSchool] = useState("");
//     const [date, setDate] = useState("");

//     const handleSubmit = () => {
//         console.log("Selected District:", district);
//         console.log("Selected School:", school);
//         console.log("Selected Date:", date);
//         alert(`Filter Applied: ${district}, ${school}, ${date}`);
//     };

//     return (
//         <div className="shadow-md rounded-2xl border border-gray-200 bg-white p-6 w-full">
//             <h2 className="text-lg font-semibold mb-4 text-gray-800">
//                 Filter Attendance
//             </h2>

//             {/* District */}
//             <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Select District
//                 </label>
//                 <select
//                     value={district}
//                     onChange={(e) => setDistrict(e.target.value)}
//                     className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
//                 >
//                     <option value="">Choose District</option>
//                     <option value="Amritsar">Amritsar</option>
//                     <option value="Ludhiana">Ludhiana</option>
//                     <option value="Patiala">Patiala</option>
//                     <option value="Jalandhar">Jalandhar</option>
//                 </select>
//             </div>

//             {/* School */}
//             <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Select School
//                 </label>
//                 <select
//                     value={school}
//                     onChange={(e) => setSchool(e.target.value)}
//                     className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
//                 >
//                     <option value="">Choose School</option>
//                     <option value="Govt Senior Secondary School">Govt Senior Secondary School</option>
//                     <option value="Govt High School">Govt High School</option>
//                     <option value="Govt Primary School">Govt Primary School</option>
//                 </select>
//             </div>

//             {/* Date */}
//             <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Select Date
//                 </label>
//                 <input
//                     type="date"
//                     value={date}
//                     onChange={(e) => setDate(e.target.value)}
//                     className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
//                 />
//             </div>

//             {/* Submit */}
//             <button
//                 onClick={handleSubmit}
//                 className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
//             >
//                 Submit
//             </button>
//         </div>
//     );
// }

// export default FilterCard;

import { useState, useEffect } from "react";

function FilterCard() {
  const [district, setDistrict] = useState("");
  const [school, setSchool] = useState("");
  const [date, setDate] = useState("");

  const [districts, setDistricts] = useState([]);
  const [schools, setSchools] = useState([]);

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch districts on load
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/schools/districts");
        const data = await res.json();
        if (Array.isArray(data)) setDistricts(data);
      } catch (err) {
        console.error("Failed to fetch districts:", err);
      }
    };
    fetchDistricts();
  }, []);

  // Fetch schools when district changes OR on initial load
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const url = new URL("http://localhost:5000/api/schools/all");
        if (district) url.searchParams.append("district", district);

        const res = await fetch(url);
        const data = await res.json();
        if (Array.isArray(data)) setSchools(data);
      } catch (err) {
        console.error("Failed to fetch schools:", err);
      }
    };
    fetchSchools();
  }, [district]);

  const handleSubmit = async () => {
    setLoading(true);
    setResults([]);

    try {
      const queryParams = new URLSearchParams({
        ...(district && { district }),
        ...(school && { school }),
        ...(date && { date }),
      });

      const response = await fetch(
        `http://localhost:5000/api/filter?${queryParams}`
      );

      if (!response.ok) throw new Error("Failed to fetch filtered data");
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error fetching filter results:", error);
      alert("Something went wrong while fetching data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shadow-md rounded-2xl border border-gray-200 bg-white p-6 w-full">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">
        Filter Attendance
      </h2>

      {/* District */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select District
        </label>
        <select
          value={district}
          onChange={(e) => {
            setDistrict(e.target.value);
            setSchool(""); // reset school
          }}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All Districts</option>
          {districts.map((d, idx) => (
            <option key={idx} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* School */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select School
        </label>
        <select
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All Schools</option>
          {schools.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
      >
        {loading ? "Loading..." : "Submit"}
      </button>

      {/* Results */}
      <div className="mt-6">
        {results.length > 0 ? (
          <div className="overflow-x-auto bg-gray-50 border rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead className="bg-green-100">
                <tr>
                  <th className="p-2 border-b">Student</th>
                  <th className="p-2 border-b">School</th>
                  <th className="p-2 border-b">Date</th>
                  <th className="p-2 border-b">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item) => (
                  <tr key={item.attendance_id} className="hover:bg-gray-100">
                    <td className="p-2 border-b">{item.student_name}</td>
                    <td className="p-2 border-b">{item.school_name}</td>
                    <td className="p-2 border-b">{item.date}</td>
                    <td className="p-2 border-b">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !loading ? (
          <p className="text-gray-500 mt-4">No results found</p>
        ) : null}
      </div>
    </div>
  );
}

export default FilterCard;
