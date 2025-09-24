import { useState } from "react";
import Modal from "./Modal";

function SchoolsPage() {
    const [schools] = useState([
        { name: "Govt Senior Secondary School, Ludhiana", area: "Ludhiana", students: 1200 },
        { name: "Govt High School, Amritsar", area: "Amritsar", students: 950 },
        { name: "Govt Girls Senior Secondary School, Patiala", area: "Patiala", students: 800 },
        { name: "Govt Senior Secondary School, Jalandhar", area: "Jalandhar", students: 1100 },
        { name: "Govt Primary School, Bathinda", area: "Bathinda", students: 450 },
    ]);

    // State for Modal
    // const [isModalOpen, setIsModalOpen] = useState(false);
    // const handleAddSchool = (newSchool) => {
    //     setSchools([...schools, newSchool]);
    // };
    // end State for Modal

    return (
        <div className="min-h-screen bg-gray-100 p-10">
            {/* Header with Add Button(optional) */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    Registered Government Schools in Punjab
                </h1>
                
                {/* add button if required */}
                {/* <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                    + Add New School
                </button> */}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-white shadow-md rounded-lg">
                    <thead>
                        <tr className="bg-green-600 text-white">
                            <th className="px-6 py-3 text-left">School Name</th>
                            <th className="px-6 py-3 text-left">Area</th>
                            <th className="px-6 py-3 text-left">Students Registered</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schools.map((school, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                                <td className="px-6 py-3">{school.name}</td>
                                <td className="px-6 py-3">{school.area}</td>
                                <td className="px-6 py-3">{school.students}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {/* <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleAddSchool}
            /> */}
        </div>
    );
}

export default SchoolsPage