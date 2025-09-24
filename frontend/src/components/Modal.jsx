export default function Modal({ isOpen, onClose, onSave }) {
    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const name = e.target.name.value;
        const area = e.target.area.value;
        const students = e.target.students.value;
        onSave({ name, area, students: parseInt(students) });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-600 hover:text-black"
                >
                    ✕
                </button>
                <h2 className="text-xl font-bold mb-4">Add New School</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        name="name"
                        placeholder="School Name"
                        className="w-full border p-2 rounded"
                        required
                    />
                    <input
                        type="text"
                        name="area"
                        placeholder="Area"
                        className="w-full border p-2 rounded"
                        required
                    />
                    <input
                        type="number"
                        name="students"
                        placeholder="Students Capacity"
                        className="w-full border p-2 rounded"
                        required
                    />
                    <button
                        type="submit"
                        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                    >
                        Save
                    </button>
                </form>
            </div>
        </div>
    );
}
