export default function TaskBoard({ tasks }) {
    if (!tasks || tasks.length === 0) return <p>No tasks assigned.</p>;
    return (
        <div className="grid gap-3">
            {tasks.map((task) => (
                <div key={task._id} className="border p-3 rounded shadow-sm">
                    <h3 className="font-semibold">{task.title}</h3>
                    <p>{task.description}</p>
                    <p className="text-sm text-gray-500">Status: {task.status}</p>
                </div>
            ))}
        </div>
    );
}