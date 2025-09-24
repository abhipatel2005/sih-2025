function Card({ title, value }) {
    return (
        <div className="shadow-md rounded-2xl border border-gray-200 bg-white p-6 flex flex-col items-center justify-center h-40">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">{title}</h2>
            <p className="text-3xl font-bold text-blue-600">{value}</p>
        </div>
    );
}

export default Card;
