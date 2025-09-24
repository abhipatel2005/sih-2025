import { useNavigate } from "react-router-dom";
import Card from './Card'
import FilterCard from "./FilterCard";
import { supabase } from '../config/SupaBaseClient.js'
import { useState, useEffect } from "react";

function Overview() {
    const navigate = useNavigate();
    const [totalStudents, setTotalStudents] = useState(0);
    const [totalSchools, setTotalSchools] = useState(0);

    useEffect(() => {
        fetchCounts();
    })

    const fetchCounts = async () => {
        // Fetch Students Count
        const { count: studentCount, error: studentError } = await supabase
            .from("students")
            .select("*", { count: "exact", head: true });

        if (!studentError) {
            setTotalStudents(studentCount);
        } else {
            console.error("Error fetching students count:", studentError);
        }

        // Fetch Schools Count
        const { count: schoolCount, error: schoolError } = await supabase
            .from("schools")
            .select("*", { count: "exact", head: true });

        if (!schoolError) {
            setTotalSchools(schoolCount);
        } else {
            console.error("Error fetching schools count:", schoolError);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex flex-col items-center py-10">
            {/* Heading */}
            <h1 className="text-3xl font-bold text-gray-800 mb-10">
                Associated with Government of Punjab
            </h1>

            {/* Cards Container */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-11/12 max-w-6xl">
                <FilterCard />

                <Card
                    title="Total Students Registered"
                    value={totalStudents}
                />

                <div onClick={() => navigate("/schools")} className="cursor-pointer">
                    <Card title="Schools Registered" value={totalSchools} />
                </div>

            </div>
        </div>
    )
}

export default Overview