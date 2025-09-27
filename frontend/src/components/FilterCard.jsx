import { useState } from "react";

function FilterCard() {
    const [district, setDistrict] = useState("");
    const [school, setSchool] = useState("");
    const [date, setDate] = useState("");

    const handleSubmit = () => {
        console.log("Selected District:", district);
        console.log("Selected School:", school);
        console.log("Selected Date:", date);
        alert(`Filter Applied: ${district}, ${school}, ${date}`);
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
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                    <option value="">Choose District</option>
                    <option value="Amritsar">Amritsar</option>
                    <option value="Ludhiana">Ludhiana</option>
                    <option value="Patiala">Patiala</option>
                    <option value="Jalandhar">Jalandhar</option>
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
                    <option value="">Choose School</option>
                    <option value="Govt Senior Secondary School">Govt Senior Secondary School</option>
                    <option value="Govt High School">Govt High School</option>
                    <option value="Govt Primary School">Govt Primary School</option>
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
                Submit
            </button>
        </div>
    );
}

export default FilterCard;
