// src/components/Projects/ProjectCard.jsx
import React from "react";

export default function ProjectCard({ project, user, onApply }) {
  const isFreelancer = user && user.role === "freelancer";

  return (
    <div className="border rounded-lg p-4 shadow hover:shadow-md transition bg-white">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold">{project.title}</h2>
          <p className="text-gray-600 mt-1">{project.description}</p>
          <p className="text-sm text-gray-500 mt-2">Budget: ${project.budget}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">{project.status}</div>
          {project.client && (
            <div className="mt-2 text-xs text-gray-500">Posted by: {project.client.name || "Client"}</div>
          )}
        </div>
      </div>

      {isFreelancer && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={onApply}
            className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
