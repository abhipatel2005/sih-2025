import { useNavigate } from "react-router-dom";
import Card from './Card'
import FilterCard from "./FilterCard";

function Overview() {
    const navigate = useNavigate();

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
                    value="12,345"
                />

                <div onClick={() => navigate("/schools")} className="cursor-pointer">
                    <Card title="Schools Registered" value="850" />
                </div>

            </div>
        </div>
    )
}

export default Overview