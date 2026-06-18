// frontend/src/components/Projects/TaskList.jsx
export default function TaskList({ tasks }) {
  if (!tasks || tasks.length === 0) return <p>No tasks yet.</p>;
  return (
    <ul className="space-y-2">
      {tasks.map((task) => (
        <li key={task._id} className="border p-3 rounded shadow-sm">
          <p><strong>Title:</strong> {task.title}</p>
          <p><strong>Status:</strong> {task.status}</p>
          <p><strong>Priority:</strong> {task.priority || 'Medium'}</p>
        </li>
      ))}
    </ul>
  );
}
